import boto3
import logging
from typing import List

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class KnowledgeBaseRetriever:
    """
    A simple API to retrieve top document chunks from an AWS Knowledge Base service
    (e.g., Amazon Kendra) using natural language queries.
    """

    def __init__(self, aws_access_key: str, aws_secret_key: str, aws_region: str, kb_id: str):
        """
        Initialize the KnowledgeBaseRetriever with AWS credentials and the Knowledge Base ID.
        
        Parameters:
            aws_access_key (str): Your AWS access key.
            aws_secret_key (str): Your AWS secret key.
            aws_region (str): AWS region where the service is deployed.
            kb_id (str): The Knowledge Base identifier (e.g., the Amazon Kendra IndexId).
        """
        self.kb_id = kb_id
        try:
            self.client = boto3.client(
                'kendra',
                aws_access_key_id=aws_access_key,
                aws_secret_access_key=aws_secret_key,
                region_name=aws_region
            )
            logger.info("Initialized AWS Kendra client successfully.")
        except Exception as e:
            logger.error(f"Error initializing Kendra client: {e}")
            raise

    def query_knowledge_base(self, query_text: str, top_k: int = 10) -> List[str]:
        """
        Query the knowledge base using the given natural language query and return the top results.
        
        Parameters:
            query_text (str): The natural language query.
            top_k (int): The maximum number of document chunks to return (default is 10).
        
        Returns:
            List[str]: A list of text excerpts (chunks) from the retrieved documents.
        """
        try:
            response = self.client.query(
                IndexId=self.kb_id,
                QueryText=query_text,
                PageSize=top_k
            )
            result_items = response.get("ResultItems", [])
            top_chunks = []

            # Process each result item to extract a meaningful text excerpt.
            for item in result_items:
                # Amazon Kendra may return different types (DOCUMENT, QUESTION_ANSWER, ANSWER, etc.)
                # Here we try to extract the DocumentExcerpt; fallback to DocumentTitle if needed.
                excerpt = item.get("DocumentExcerpt", {}).get("Text")
                if excerpt:
                    top_chunks.append(excerpt.strip())
                else:
                    title = item.get("DocumentTitle", {}).get("Text", "").strip()
                    if title:
                        top_chunks.append(title)

            logger.info(f"Retrieved {len(top_chunks)} chunks from the knowledge base.")
            return top_chunks

        except Exception as e:
            logger.error(f"Error querying the knowledge base: {e}")
            return []


# Example usage:
if __name__ == "__main__":
    import os
    from dotenv import load_dotenv

    load_dotenv()  # Load AWS credentials and KB_ID from environment variables if needed

    # AWS credentials and Kendra IndexId (KB_ID) from environment variables or configuration
    AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
    AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")
    AWS_REGION = os.getenv("AWS_REGION")
    KB_ID = os.getenv("KB_ID")  # Your Amazon Kendra IndexId

    # Instantiate the retriever
    retriever = KnowledgeBaseRetriever(
        aws_access_key=AWS_ACCESS_KEY,
        aws_secret_key=AWS_SECRET_KEY,
        aws_region=AWS_REGION,
        kb_id=KB_ID
    )

    # Perform a query
    user_query = "How can I reset my password?"
    top_chunks = retriever.query_knowledge_base(query_text=user_query, top_k=10)

    # Output the retrieved document chunks
    for i, chunk in enumerate(top_chunks, start=1):
        print(f"Chunk {i}:\n{chunk}\n")
