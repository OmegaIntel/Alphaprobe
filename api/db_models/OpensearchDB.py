import os
import asyncio
import logging
import boto3
import requests
from llama_index.core import StorageContext, VectorStoreIndex
from opensearchpy import (
    AWSV4SignerAuth,
    RequestsHttpConnection,
    AuthorizationException,
    NotFoundError
)
from llama_index.vector_stores.opensearch import (
    OpensearchVectorClient,
    OpensearchVectorStore
)
from llama_parse import LlamaParse  # Using the asynchronous loader from llama_parse

# Configure logging: set global logging to INFO (and suppress detailed logs for llama_index and opensearchpy)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logging.getLogger("llama_index").setLevel(logging.ERROR)
logging.getLogger("llama_index.core").setLevel(logging.ERROR)
logging.getLogger("llama_index.vector_stores").setLevel(logging.ERROR)
logging.getLogger("opensearchpy").setLevel(logging.ERROR)

logger = logging.getLogger(__name__)

# Patched AWSV4SignerAuth to work with the OpenSearch client.
class PatchedAWSV4SignerAuth(AWSV4SignerAuth):
    def __call__(self, method, url, body, headers=None):
        if headers is None:
            headers = {}
        req = requests.Request(method, url, data=body, headers=headers)
        prepared = req.prepare()
        signed_prepared = super().__call__(prepared)
        return signed_prepared.headers

# Read AWS and OpenSearch settings from environment variables.
aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
aws_region = os.getenv("AWS_REGION", "us-east-1")
OPENSEARCH_ENDPOINT = "https://yygf1pq8fcuu2qgx9awe.us-east-1.aoss.amazonaws.com:443"
INDEX_NAME = "opensearch-llamaindex"

# Set the desired embedding dimension.
EMBEDDING_DIMENSION = 1536
TEXT_FIELD = "content"
EMBEDDING_FIELD = "embedding"

# Setup AWS credentials and OpenSearch authentication.
credentials = boto3.Session(
    aws_access_key_id=aws_access_key,
    aws_secret_access_key=aws_secret_key,
).get_credentials()
auth = PatchedAWSV4SignerAuth(credentials, aws_region, service="aoss")

# Instantiate the custom OpenSearch vector client.
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

# Create the vector client and test connectivity.
vector_client = CustomOpensearchVectorClient(
    opensearch_url=OPENSEARCH_ENDPOINT,
    index_name=INDEX_NAME,
    dim=EMBEDDING_DIMENSION,
    embedding_field=EMBEDDING_FIELD,
    text_field=TEXT_FIELD,
    http_auth=auth
)
logger.info("LlamaIndex OpenSearch client (CustomOpensearchVectorClient) initialized successfully.")

try:
    test_response = vector_client._os_client.search(
        index=INDEX_NAME,
        body={"query": {"match_all": {}}},
        size=1
    )
    logger.info("Connectivity test succeeded.")
except Exception as e:
    logger.error(f"Connectivity test failed: {e}")

# Instantiate the vector store.
vector_store = OpensearchVectorStore(vector_client)

# ---------- Index Creation Functions ----------
def _create_index(index_name: str, embedding_dimension: int):
    """Create an OpenSearch index with a knn_vector mapping for the embedding field."""
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
                    "dimension": embedding_dimension
                }
            }
        }
    }
    vector_client._os_client.indices.create(index=index_name, body=mapping)
    logger.info(f"Created index '{index_name}' with dimension {embedding_dimension}")

def create_collection(index_name: str, embedding_dimension: int):
    """
    Ensure the index exists with the correct embedding dimension.
    If it exists but its dimension does not match, delete and re-create it.
    """
    os_client = vector_client._os_client
    if os_client.indices.exists(index=index_name):
        current_mapping = os_client.indices.get_mapping(index=index_name)
        existing_dim = current_mapping[index_name]["mappings"]["properties"]["embedding"]["dimension"]
        if existing_dim != embedding_dimension:
            logger.info(f"Dimension mismatch for index '{index_name}': existing {existing_dim} vs desired {embedding_dimension}. Recreating index.")
            os_client.indices.delete(index=index_name)
            _create_index(index_name, embedding_dimension)
        else:
            logger.info(f"Index '{index_name}' exists with matching dimension {existing_dim}.")
    else:
        _create_index(index_name, embedding_dimension)

# ---------- Document Ingestion & Query Functions ----------
def store_documents(documents_dir: str):
    """
    Read documents from a directory (or file URL), parse them using LlamaParse's asynchronous loader,
    embed them, and index them into OpenSearch.
    """
    create_collection(INDEX_NAME, EMBEDDING_DIMENSION)

    # Retrieve the Llama API key from the environment.
    llama_api_key = os.getenv("LLAMA_API_KEY")
    if not llama_api_key:
        raise ValueError("LLAMA_API_KEY environment variable is not set.")

    # Instantiate LlamaParse with desired result type (e.g. "markdown").
    parser = LlamaParse(result_type="markdown", api_key=llama_api_key)

    # Use asyncio to run the asynchronous document loading.
    parsed_documents = asyncio.run(parser.aload_data(documents_dir))
    if not parsed_documents:
        raise RuntimeError("No documents were parsed from the given directory or URL.")

    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    index = VectorStoreIndex.from_documents(parsed_documents,
                                              storage_context=storage_context,
                                              show_progress=False)
    logger.info(f"Stored {len(parsed_documents)} documents into the index.")
    return index

def query_index(query_str: str, top_k: int = 5):
    """
    Query the vector store index for the given query string.
    """
    index = VectorStoreIndex.from_vector_store(vector_store)
    query_engine = index.as_query_engine(similarity_top_k=top_k, verbose=False)
    result = query_engine.query(query_str)
    if hasattr(result, "response"):
        return result.response
    elif hasattr(result, "answer"):
        return result.answer
    else:
        return str(result)

# ---------- Main Routine ----------
if __name__ == "__main__":
    try:
        documents_dir = "./api/unit_tests/dir"  # Update with your documents directory or file URL

        # Uncomment the following line to index documents using LlamaParse's asynchronous loader.
        store_documents(documents_dir)

        test_query = "What were J&J Medtech's R&D expenditure over last 3 years?"
        final_answer = query_index(test_query, top_k=5)
        print("Final Answer:", final_answer)
    except Exception as e:
        logger.error(f"Error during main execution: {e}", exc_info=True)
        raise
