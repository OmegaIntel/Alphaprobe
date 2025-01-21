import os
import asyncio
import logging
from typing import List, Optional
from dotenv import load_dotenv

import boto3
from opensearchpy import OpenSearch, AWSV4SignerAuth, RequestsHttpConnection
from opensearchpy.helpers import bulk

from llama_parse import LlamaParse
from openai import OpenAI  # Changed from llama_index.embeddings.openai

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class OpenSearchManager:
    """
    Manages connection to AWS OpenSearch Serverless with enhanced error handling,
    proper OpenSearch Serverless compatibility, and improved logging.
    """

    def __init__(self):
        """
        Initialize OpenSearch client and embedding model.
        Enhanced with dynamic dimension detection and better error handling.
        """
        aws_access_key = os.getenv("AWS_ACCESS_KEY")
        aws_secret_key = os.getenv("AWS_SECRET_KEY")
        aws_region = os.getenv("AWS_REGION")
        opensearch_host = os.getenv("OPENSEARCH_HOST")
        openai_api_key = os.getenv("OPENAI_API_KEY")

        if not all([aws_access_key, aws_secret_key, aws_region, opensearch_host, openai_api_key]):
            raise RuntimeError("Missing required environment variables")

        # Initialize OpenAI client directly for better control
        self.embedding_client = OpenAI(api_key=openai_api_key)
        self.embedding_model = "text-embedding-3-large"
        self.embedding_dimension = self._get_embedding_dimension()

        # Configure AWS authentication
        credentials = boto3.Session(
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            region_name=aws_region
        ).get_credentials()

        self.os_client = OpenSearch(
            hosts=[{"host": opensearch_host, "port": 443}],
            http_auth=AWSV4SignerAuth(credentials, aws_region, "aoss"),
            use_ssl=True,
            verify_certs=True,
            connection_class=RequestsHttpConnection,
            timeout=30
        )

    def _get_embedding_dimension(self) -> int:
        """Dynamically determine embedding dimension from the model"""
        try:
            test_embedding = self.embedding_client.embeddings.create(
                input="test",
                model=self.embedding_model
            )
            return len(test_embedding.data[0].embedding)
        except Exception as e:
            logger.error(f"Failed to get embedding dimension: {str(e)}")
            raise

    async def create_collection(self, collection_name: str, document_id: str, file_url: str) -> str:
        """
        Parse and index documents with enhanced error handling and logging.
        Removed explicit _id assignment for Serverless compatibility.
        """
        try:
            # Create index if needed
            if not self.os_client.indices.exists(index=collection_name):
                self._create_index(collection_name)

            # Parse documents
            parser = LlamaParse(result_type="markdown")
            parsed_docs = await parser.aload_data(file_url)
            
            if not parsed_docs:
                raise RuntimeError("No content parsed from file")

            logger.info(f"Parsed {len(parsed_docs)} documents from {file_url}")

            # Process documents
            bulk_docs = []
            for i, doc in enumerate(parsed_docs):
                try:
                    text = doc.text or ""
                    embedding = self.embedding_client.embeddings.create(
                        input=text,
                        model=self.embedding_model
                    ).data[0].embedding

                    bulk_docs.append({
                        "_index": collection_name,
                        "_source": {
                            "document_id": document_id,
                            "content": text,
                            "embedding": embedding
                        }
                    })
                except Exception as e:
                    logger.error(f"Failed to process chunk {i}: {str(e)}")
                    continue

            # Bulk insert with error tracking
            success_count, errors = bulk(self.os_client, bulk_docs)
            
            if errors:
                logger.error(f"Failed to index {len(errors)} documents")
                for error in errors[:3]:  # Log first 3 errors to avoid flooding
                    logger.error(f"Error: {error.get('error', {}).get('reason', 'Unknown error')}")

            return f"Successfully indexed {success_count} documents"

        except Exception as e:
            logger.error(f"Critical error in create_collection: {str(e)}", exc_info=True)
            raise

    def _create_index(self, index_name: str):
        """Create index with dynamic dimension mapping"""
        mapping = {
            "settings": {
                "index": {"knn": True},
                "analysis": {"analyzer": {"default": {"type": "standard"}}}
            },
            "mappings": {
                "properties": {
                    "document_id": {"type": "keyword"},
                    "content": {"type": "text"},
                    "embedding": {
                        "type": "knn_vector",
                        "dimension": self.embedding_dimension
                    }
                }
            }
        }
        self.os_client.indices.create(index=index_name, body=mapping)
        logger.info(f"Created index '{index_name}' with dimension {self.embedding_dimension}")

    def knn_search(self, index_name: str, query_text: str, top_k: int = 10) -> List[str]:
        """Enhanced search with better error handling"""
        try:
            embedding = self.embedding_client.embeddings.create(
                input=query_text,
                model=self.embedding_model
            ).data[0].embedding

            response = self.os_client.search(
                index=index_name,
                body={
                    "size": top_k,
                    "query": {
                        "knn": {
                            "embedding": {
                                "vector": embedding,
                                "k": top_k
                            }
                        }
                    }
                }
            )
            return [hit["_source"]["content"] for hit in response.get("hits", {}).get("hits", [])]
        
        except Exception as e:
            logger.error(f"Search failed: {str(e)}")
            return []

    def delete_context(self, collection_name: str) -> str:
        """Safer delete with confirmation"""
        if self.os_client.indices.exists(index=collection_name):
            self.os_client.indices.delete(index=collection_name)
            logger.info(f"Deleted index '{collection_name}'")
            return f"Index '{collection_name}' deleted"
        return f"Index '{collection_name}' not found"

    def get_collection(self, collection_name: str) -> bool:
        """Check index existence"""
        return self.os_client.indices.exists(index=collection_name)