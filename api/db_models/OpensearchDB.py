import os
import asyncio
import logging
from typing import List, Optional
from dotenv import load_dotenv

import boto3
from opensearchpy import OpenSearch, AWSV4SignerAuth, RequestsHttpConnection
from opensearchpy.helpers import bulk

from llama_parse import LlamaParse
from llama_index.embeddings.openai import OpenAIEmbedding

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OpenSearchManager:
    """
    Manages connection to AWS OpenSearch Serverless and provides methods
    to create indexes, store documents (with embeddings), and perform
    k-NN (vector) queries.
    """

    def __init__(self):
        """
        Initialize the OpenSearch client for AWS Serverless using SigV4 auth.
        Requires environment variables:
          - OPENSEARCH_HOST
          - AWS_ACCESS_KEY
          - AWS_SECRET_KEY
          - AWS_REGION
          - OPENAI_API_KEY (if using OpenAI embeddings)
        """
        aws_access_key = os.getenv("AWS_ACCESS_KEY")
        aws_secret_key = os.getenv("AWS_SECRET_KEY")
        aws_region = os.getenv("AWS_REGION")
        opensearch_host = os.getenv("OPENSEARCH_HOST")

        if not all([aws_access_key, aws_secret_key, aws_region, opensearch_host]):
            raise RuntimeError(
                "Missing one or more required environment variables for OpenSearch."
            )

        # Create AWS SigV4 signer
        credentials = boto3.Session(
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            region_name=aws_region
        ).get_credentials()

        auth = AWSV4SignerAuth(credentials, aws_region, "aoss")  # 'aoss' = OpenSearch Serverless

        # Initialize the OpenSearch client
        self.client = OpenSearch(
            hosts=[{"host": opensearch_host, "port": 443}],
            http_auth=auth,
            use_ssl=True,
            verify_certs=True,
            connection_class=RequestsHttpConnection,
        )

        # Initialize embedding model
        self.embedding_model = OpenAIEmbedding(
            model="text-embedding-3-large",  # You can adjust to the model you prefer
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            # The user code suggests 1024 dimensions for 'text-embedding-3-large'
            dimensions=1024
        )

    async def create_collection(self, collection_name: str, document_id: str, file_url: str) -> str:
        """
        Asynchronously parse a remote file using LlamaParse, embed chunks, and insert into OpenSearch.
        If 'collection_name' (index) doesn't exist, it is created.

        :param collection_name: Name of the OpenSearch index.
        :param document_id: Unique identifier for the document being inserted.
        :param file_url: Public or presigned URL to the file to be parsed.
        :return: Status message indicating how many chunks were inserted.
        """
        # 1) Ensure the index exists; create if not
        if not self.client.indices.exists(index=collection_name):
            self._create_index(collection_name)

        # 2) Parse the file asynchronously via LlamaParse
        parser = LlamaParse(result_type="markdown")
        try:
            parsed_docs = await parser.aload_data(file_url)
        except Exception as e:
            raise RuntimeError(f"Error parsing file at {file_url}: {str(e)}")

        # 3) Convert parsed docs to bulk format with embeddings
        bulk_docs = []
        for i, doc in enumerate(parsed_docs):
            chunk_id = f"{document_id}_{i}"
            text_content = doc.text or ""

            # Generate embedding via OpenAI
            embedding_vector = self.embedding_model.get_embedding(text_content)

            record = {
                "_index": collection_name,
                "_id": chunk_id,
                "_source": {
                    "document_id": document_id,
                    "content": text_content,
                    "embedding": embedding_vector
                }
            }
            bulk_docs.append(record)

        # 4) Bulk insert into OpenSearch
        success_count, _ = bulk(self.client, bulk_docs)
        return f"Inserted {success_count} chunks into index '{collection_name}'."

    def _create_index(self, index_name: str):
        """
        Internal helper to create an index with knn_vector for embeddings.
        Adjust the dimension if your embedding model differs.
        """
        mapping_body = {
            "settings": {
                "index": {
                    "knn": True  # For older distributions (Serverless often auto-handles)
                },
                "analysis": {
                    "analyzer": {
                        "default": {
                            "type": "standard"
                        }
                    }
                }
            },
            "mappings": {
                "properties": {
                    "document_id": {"type": "keyword"},
                    "content": {"type": "text"},
                    "embedding": {
                        "type": "knn_vector",
                        "dimension": 1024  # Must match the embed model dimension
                    }
                }
            }
        }
        self.client.indices.create(index=index_name, body=mapping_body)
        logger.info(f"Created new index '{index_name}' with knn_vector mappings.")

    def knn_search(self, index_name: str, query_text: str, top_k: int = 10) -> List[str]:
        """
        Perform a k-NN vector search on the 'embedding' field for the given query text.

        :param index_name: Name of the OpenSearch index
        :param query_text: The text query to be embedded and searched
        :param top_k: Number of nearest neighbors to retrieve
        :return: List of content strings for the top results
        """
        # Embed the query text
        embedding_vector = self.embedding_model.get_embedding(query_text)

        # Build a k-NN search query
        knn_query = {
            "size": top_k,
            "_source": ["content"],
            "query": {
                "knn": {
                    "embedding": {
                        "vector": embedding_vector,
                        "k": top_k
                    }
                }
            }
        }
        response = self.client.search(index=index_name, body=knn_query)
        hits = response.get("hits", {}).get("hits", [])
        return [hit["_source"]["content"] for hit in hits]

    def delete_context(self, collection_name: str) -> str:
        """
        Delete the entire index (collection).
        """
        if self.client.indices.exists(index=collection_name):
            self.client.indices.delete(index=collection_name)
            return f"Index '{collection_name}' deleted successfully."
        else:
            return f"Index '{collection_name}' does not exist."

    def get_collection(self, collection_name: str) -> bool:
        """
        Check if an index (collection) exists in OpenSearch.
        """
        return self.client.indices.exists(index=collection_name)
