import weaviate.classes.config as wc
import weaviate
from llmsherpa.readers import LayoutPDFReader
from dotenv import load_dotenv
from os import getenv
from typing import List
from weaviate import Client
from pdfminer.high_level import extract_text
import requests
from io import BytesIO
import os

load_dotenv()


class WeaviateManager:
    def __init__(self):
        self.client = weaviate.connect_to_local(host=os.getenv("WEAVIATE_HOST"))

    def __del__(self):
        self.client.close()

    def chunk_text(self,text, chunk_size=800, overlap=100):
        chunks = []
        start = 0
        length = len(text)
        while start < length:
            end = min(start + chunk_size, length)
            chunk = text[start:end]
            chunks.append(chunk)
            start += chunk_size - overlap
        return chunks
    
    def get_file_chunks(self, file_path: str) -> List[str]:
        response = requests.get(file_path)

        if response.status_code == 200:
            pdf_content = BytesIO(response.content)
            text = extract_text(pdf_content)
            chunks=self.chunk_text(text)
            return chunks
        else:
            raise Exception(f"Failed to fetch the PDF file. Status code: {response.status_code}")


    def create_objects(self, collection_name: str, document_id: str, chunks: List[str]) -> List[dict]:
            objects = []
            for chunk in chunks:
                obj = {
                    "class": collection_name,
                    "properties": {
                        "content": chunk,
                        "document_id": str(document_id),
                    },
                }
                objects.append(obj)
            return objects

    def insert_data(self, collection_name: str, document_id: str, file_path: str) -> str:
        chunks = self.get_file_chunks(file_path)
        objects = self.create_objects(collection_name, document_id, chunks)
        collection = self.client.collections.get(collection_name)

        with collection.batch.dynamic() as batch:
            for obj in objects:
                batch.add_object(
                    properties=obj["properties"],
                )
        return "Data inserted"

    def create_collection(self, collection_name: str, document_id: str, file_path: str) -> str:
        """Create a collection if it doesn't exist or append data to the existing collection."""
        class_names = list( self.client.collections.list_all().keys())
        if collection_name.capitalize() in class_names:
            # If the collection exists, just append the new document and chunks
            self.insert_data(collection_name, document_id, file_path)
        else:
            self.client.collections.create(
                name=collection_name,
                properties=[
                    wc.Property(name="document_id", data_type=wc.DataType.TEXT),
                    wc.Property(name="content", data_type=wc.DataType.TEXT),
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
        
        for obj in response.objects:  
            retrieved_content = obj.properties.get("content")  
            retrieved_contents.append(retrieved_content)  
        
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
    

    def get_collection(self, collection_name: str) -> bool:

        try:
            collection_object = self.client.collections.get(collection_name)
            if collection_object :
                return True
        except Exception as e:
            print(e)
            return False
