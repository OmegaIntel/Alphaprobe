import weaviate.classes.config as wc
import weaviate
from dotenv import load_dotenv
from typing import List
import requests
from io import BytesIO
from llama_index.core.schema import TextNode
from doc_parser.llama_parse_pdf import llama_parse_pdf
import os

load_dotenv()


class WeaviateManager:
    def __init__(self):
        self.client = weaviate.connect_to_local(host=os.getenv("WEAVIATE_HOST"))

    def __del__(self):
        self.client.close()

    def get_file_chunks(self, file_path: str) -> List[TextNode]:
        """file_path: AWS signed URL, for now."""
        response = requests.get(file_path)
        if response.status_code == 200:
            pdf_content = BytesIO(response.content)
            return llama_parse_pdf(pdf_content)
        else:
            raise Exception(f"Failed to fetch the PDF file. Status code: {response.status_code}")

    def create_objects(self, collection_name: str, document_id: str, file_path: str, chunks: List[TextNode]) -> List[dict]:
        """file_path: AWS signed URL, for now."""
        objects = []
        for chunk in chunks:
            obj = {
                "class": collection_name,
                "properties": {
                    "document_id": str(document_id),
                    "content": chunk,
                    "page_number": chunk.metadata.get("page_number"),
                    "file_path": file_path,
                },
            }
            objects.append(obj)
        return objects


    def insert_data(self, collection_name: str, document_id: str, file_path: str) -> str:
        """file_path: AWS signed URL, for now."""
        chunks = self.get_file_chunks(file_path)
        objects = self.create_objects(collection_name, document_id, file_path, chunks)
        collection = self.client.collections.get(collection_name)

        with collection.batch.dynamic() as batch:
            for obj in objects:
                batch.add_object(properties=obj["properties"])
        return "Data inserted"


    def create_collection(self, collection_name: str, document_id: str, file_path: str) -> str:
        """Create a collection if it doesn't exist or append data to the existing collection."""
        class_names = list(self.client.collections.list_all().keys())
        if collection_name.capitalize() in class_names:
            # If the collection exists, just append the new document and chunks
            self.insert_data(collection_name, document_id, file_path)
        else:
            self.client.collections.create(
                name=collection_name,
                properties=[
                    wc.Property(name="document_id", data_type=wc.DataType.TEXT),
                    wc.Property(name="content", data_type=wc.DataType.TEXT),
                    wc.Property(name="page_number", data_type=wc.DataType.INT),
                    wc.Property(name="file_path", data_type=wc.DataType.TEXT),
                ],
                vectorizer_config=wc.Configure.Vectorizer.text2vec_transformers(),
                generative_config=wc.Configure.Generative.openai(),
                vector_index_config=wc.Configure.VectorIndex.hnsw(
                    distance_metric=wc.VectorDistances.COSINE
                ),
            )
            self.insert_data(collection_name, document_id, file_path)
        return f"Collection {collection_name} handled"


    def retrieve_content(self, query: str, collection_name: str) -> List[str]:
        """
        Retrieve only the content from Weaviate using a search query.

        :param collection_name: The collection (class) name in Weaviate.
        :param query: The search query to find similar content.
        :return: List of content strings.
        """

        collection_object = self.client.collections.get(collection_name)

        response = collection_object.query.near_text(
            query=query,
            limit=5
        )
        
        retrieved_contents = []
        keys = ['content', 'page_number']
        for obj in response.objects:
            retrieved_contents.append(dict([(key, obj.properties.get(key)) for key in keys]))
        
        return retrieved_contents


    def delete_context(self, collection_name: str) -> List[str]:
        """
        Delete existing collection
        """

        collection_object = self.client.collections.get(collection_name)

        if not collection_object:
            raise Exception(f"Failed to fetch the collection")

        temp = self.client.collections.delete(collection_name)
        
        return "Collection deleted successfully!"
