# opensearch_llamaindex.py

import os
import asyncio
import logging
import boto3
import requests
from llama_index.core import StorageContext, VectorStoreIndex
from opensearchpy import AWSV4SignerAuth, RequestsHttpConnection, AuthorizationException, NotFoundError
from llama_index.vector_stores.opensearch import OpensearchVectorClient, OpensearchVectorStore
from llama_parse import LlamaParse  # For asynchronous document loading

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logging.getLogger("llama_index").setLevel(logging.ERROR)
logging.getLogger("opensearchpy").setLevel(logging.ERROR)
logger = logging.getLogger(__name__)

# Patched AWSV4SignerAuth for OpenSearch client
class PatchedAWSV4SignerAuth(AWSV4SignerAuth):
    def __call__(self, method, url, body, headers=None):
        if headers is None:
            headers = {}
        req = requests.Request(method, url, data=body, headers=headers)
        prepared = req.prepare()
        signed_prepared = super().__call__(prepared)
        return signed_prepared.headers

# Read AWS and OpenSearch settings from environment variables
aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
aws_region = os.getenv("AWS_REGION", "us-east-1")
OPENSEARCH_ENDPOINT = os.getenv("OPENSEARCH_ENDPOINT", "https://yygf1pq8fcuu2qgx9awe.us-east-1.aoss.amazonaws.com:443")
# We do not use a fixed index name; the API will pass the collection name.

# Set the desired embedding dimension (adjust as needed)
EMBEDDING_DIMENSION = 1536
TEXT_FIELD = "content"
EMBEDDING_FIELD = "embedding"

# Setup AWS credentials and authentication
credentials = boto3.Session(
    aws_access_key_id=aws_access_key,
    aws_secret_access_key=aws_secret_key
).get_credentials()
auth = PatchedAWSV4SignerAuth(credentials, aws_region, service="aoss")

# Custom OpenSearch vector client subclass using llama_index's wrapper
class CustomOpensearchVectorClient(OpensearchVectorClient):
    def __init__(self, opensearch_url, index_name, dim=EMBEDDING_DIMENSION,
                 embedding_field=EMBEDDING_FIELD, text_field=TEXT_FIELD, **kwargs):
        try:
            super().__init__(
                endpoint=opensearch_url,
                index=index_name,
                dim=dim,
                embedding_field=embedding_field,
                text_field=text_field,
                **kwargs
            )
        except AuthorizationException:
            logger.warning("AuthorizationException (403) ignored.")
        except NotFoundError:
            logger.warning(f"Index {index_name} not found; it will be created automatically.")
        except Exception as e:
            logger.error(f"Unexpected error in constructor: {e}")

    def _get_opensearch_version(self):
        logger.warning("Bypassing info() call for AOSS.")
        return "2.5.0"

    def _initialize_client(self):
        logger.warning("Bypassing _initialize_client index existence check for AOSS.")
        try:
            self._os_client.indices.get(index=self._index)
        except AuthorizationException:
            logger.warning("AuthorizationException ignored.")
        except NotFoundError:
            logger.warning(f"Index {self._index} not found; it will be created automatically.")
        except Exception as e:
            logger.error(f"Unexpected error in _initialize_client: {e}")

# Helper functions to instantiate the client and vector store
def get_vector_client(index_name: str) -> CustomOpensearchVectorClient:
    return CustomOpensearchVectorClient(
        opensearch_url=OPENSEARCH_ENDPOINT,
        index_name=index_name,
        dim=EMBEDDING_DIMENSION,
        embedding_field=EMBEDDING_FIELD,
        text_field=TEXT_FIELD,
        http_auth=auth
    )

def get_vector_store(client: CustomOpensearchVectorClient) -> OpensearchVectorStore:
    return OpensearchVectorStore(client)

# Function to create the index if needed
def _create_index(index_name: str, embedding_dimension: int, vector_client: CustomOpensearchVectorClient):
    mapping = {
        "settings": {
            "index": {"knn": True},
            "analysis": {"analyzer": {"default": {"type": "standard"}}}
        },
        "mappings": {
            "properties": {
                "document_id": {"type": "keyword"},
                "content": {"type": "text"},
                "embedding": {"type": "knn_vector", "dimension": embedding_dimension}
            }
        }
    }
    vector_client._os_client.indices.create(index=index_name, body=mapping)
    logger.info(f"Created index '{index_name}' with dimension {embedding_dimension}")

def create_collection_sync(index_name: str, embedding_dimension: int, vector_client: CustomOpensearchVectorClient):
    os_client = vector_client._os_client
    if os_client.indices.exists(index=index_name):
        current_mapping = os_client.indices.get_mapping(index=index_name)
        existing_dim = current_mapping[index_name]["mappings"]["properties"]["embedding"]["dimension"]
        if existing_dim != embedding_dimension:
            logger.info(f"Dimension mismatch for index '{index_name}': existing {existing_dim} vs desired {embedding_dimension}. Recreating index.")
            os_client.indices.delete(index=index_name)
            _create_index(index_name, embedding_dimension, vector_client)
        else:
            logger.info(f"Index '{index_name}' exists with matching dimension {existing_dim}.")
    else:
        _create_index(index_name, embedding_dimension, vector_client)

# Synchronous function that processes documents using llama_index and stores embeddings
def store_documents_sync(documents_source: str, index_name: str) -> str:
    vector_client = get_vector_client(index_name)
    # Create or verify index
    create_collection_sync(index_name, EMBEDDING_DIMENSION, vector_client)
    vector_store = get_vector_store(vector_client)
    
    # Retrieve Llama API key and instantiate LlamaParse
    llama_api_key = os.getenv("LLAMA_API_KEY")
    if not llama_api_key:
        raise ValueError("LLAMA_API_KEY environment variable is not set.")
    parser = LlamaParse(result_type="markdown", api_key=llama_api_key)
    
    parsed_documents = []
    if os.path.isdir(documents_source):
        # Define supported file extensions (adjust as needed)
        supported_extensions = [
            '.pdf', '.doc', '.docx', '.txt', '.csv', '.ppt', '.pptx', '.html', '.htm'
        ]
        all_files = [os.path.join(documents_source, f) for f in os.listdir(documents_source)]
        supported_files = [
            f for f in all_files if os.path.isfile(f) and os.path.splitext(f)[1].lower() in supported_extensions
        ]
        if not supported_files:
            raise RuntimeError("No supported files found in the directory.")
        
        async def load_all_files(file_list):
            tasks = [parser.aload_data(file_path) for file_path in file_list]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            docs = []
            for result in results:
                if isinstance(result, Exception):
                    logger.error(f"Error while parsing a file: {result}")
                elif result:
                    docs.extend(result)
            return docs
        
        parsed_documents = asyncio.run(load_all_files(supported_files))
    else:
        parsed_documents = asyncio.run(parser.aload_data(documents_source))
    
    if not parsed_documents:
        raise RuntimeError("No documents were parsed from the given source.")
    
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    # Create the index (and store embeddings) from parsed documents
    index_obj = VectorStoreIndex.from_documents(parsed_documents, storage_context=storage_context, show_progress=False)
    logger.info(f"Stored {len(parsed_documents)} documents into the index '{index_name}'.")
    return f"Successfully indexed {len(parsed_documents)} documents into {index_name}"

# Async wrapper function (to be called from your API) for creating a new collection
async def create_collection(index_name: str, document_id: str, file_url: str) -> str:
    # The document_id can be ignored or logged if needed.
    result = await asyncio.to_thread(store_documents_sync, file_url, index_name)
    return result

# New function: update an existing index with new documents.
# IMPORTANT: Because VectorStoreIndex does not support incremental updates,
# this function re-builds the index using the new documents.
# To preserve previously indexed documents, you must merge them with the new documents externally.
def update_collection_sync(documents_source: str, index_name: str) -> str:
    """
    Re-index the given documents source into the specified index.
    This effectively replaces the index with the new documents.
    If you need to preserve previously indexed documents, you must supply the union of old and new documents.
    """
    # For simplicity, we call store_documents_sync again, which re-creates the index.
    return store_documents_sync(documents_source, index_name)

# Async wrapper for update
async def update_collection(index_name: str, file_url: str) -> str:
    result = await asyncio.to_thread(update_collection_sync, file_url, index_name)
    return result

# Function to query the index (if needed)
def query_index(query_str: str, index_name: str, top_k: int = 5):
    vector_client = get_vector_client(index_name)
    vector_store = get_vector_store(vector_client)
    index_obj = VectorStoreIndex.from_vector_store(vector_store)
    query_engine = index_obj.as_query_engine(similarity_top_k=top_k, verbose=False)
    result = query_engine.query(query_str)
    if hasattr(result, "response"):
        return result.response
    elif hasattr(result, "answer"):
        return result.answer
    else:
        return str(result)

# New function: delete an index from OpenSearch
def delete_index(index_name: str) -> str:
    """
    Delete the specified OpenSearch index.
    """
    vector_client = get_vector_client(index_name)
    os_client = vector_client._os_client
    if os_client.indices.exists(index=index_name):
        os_client.indices.delete(index=index_name)
        logger.info(f"Deleted index '{index_name}'.")
        return f"Index '{index_name}' deleted successfully."
    else:
        logger.info(f"Index '{index_name}' does not exist.")
        return f"Index '{index_name}' does not exist."



# For testing independently
if __name__ == "__main__":
    try:
        documents_source = "./api/unit_tests/dir"  # Adjust as needed
        index_name = "d3e79573b816e4d04b3fa075363c528e3"
        # Test creation:
        #print(store_documents_sync(documents_source, index_name))
        test_query = "What are the projected growth rates for the medical technology market over the next 5-10 years?"
        final_answer = query_index(test_query, index_name, top_k=5)
        print("Final Answer:", final_answer)
        # Test update:
        #print(update_collection_sync(documents_source, index_name))
        # Test deletion:
        #print(delete_index(index_name))
    except Exception as e:
        logger.error(f"Error during main execution: {e}", exc_info=True)
        raise
