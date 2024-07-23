# weaviate_handler.py
import weaviate

class WeaviateDb:
    def __init__(self, url: str = "http://weaviate:8080"):
        self.client = weaviate.Client(url)

    def create_schema(self, company: str):
        class_name = f"{company}_Documents"
        schema = {
            "classes": [
                {
                    "class": class_name,
                    "description": f"Documents for {company}",
                    "vectorizer": "text2vec-transformers",
                    "properties": [
                        {
                            "name": "content",
                            "dataType": ["text"]
                        },
                        {
                            "name": "file_path",
                            "dataType": ["string"]
                        }
                    ]
                }
            ]
        }
        self.client.schema.create(schema)
        return class_name

    def upload_content(self, class_name: str, content: str, file_path: str):
        data_object = {
            "content": content,
            "file_path": file_path
        }
        self.client.data_object.create(data_object, class_name)

    def summarize_content(self, content: str) -> str:
        # Implement your logic to summarize the financial document
        # For demonstration, we'll just return the first 100 characters as summary
        return content[:100]
