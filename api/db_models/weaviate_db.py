# weaviate_db.py
import re
import weaviate
from weaviate import Client
from tqdm import tqdm
from werkzeug.security import generate_password_hash, check_password_hash

class WeaviateDb:
    def __init__(self, url: str = "http://weaviate:8080"):
        self.client = Client(url=url)
        self.create_user_schema()

    def create_user_schema(self):
        class_name = "User"
        if self.client.schema.exists(class_name):
            return

        schema = {
            "class": class_name,
            "description": "User details",
            "properties": [
                {"name": "email", "dataType": ["string"]},
                {"name": "password", "dataType": ["string"]},
            ],
        }
        self.client.schema.create_class(schema)

    def register_user(self, email: str, hashed_password: str):
        class_name = "User"
        user_data = {
            "email": email,
            "password": hashed_password,
        }
        self.client.data_object.create(user_data, class_name)

    def get_user(self, email: str):
        class_name = "User"
        query_result = self.client.query.get(class_name, ["email", "password"]).with_where({
            "path": ["email"],
            "operator": "Equal",
            "valueString": email,
        }).do()

        if query_result["data"]["Get"][class_name]:
            return query_result["data"]["Get"][class_name][0]
        return None

    def sanitize_class_name(self, company_name: str) -> str:
        # Remove any non-alphanumeric characters and capitalize the name
        sanitized_name = re.sub(r'\W+', '_', company_name)
        return sanitized_name.capitalize()

    def create_company_schema(self, company_name: str):
        # Sanitize the company name before using it as a class name
        sanitized_name = self.sanitize_class_name(company_name)
        class_name = f"{sanitized_name}_Documents"

        if self.client.schema.exists(class_name):
            print(f"Schema for {class_name} already exists.")
            return class_name

        schema = {
            "class": class_name,
            "description": f"Documents for {company_name}",
            "vectorizer": "text2vec-openai",
            "properties": [
                {"name": "content", "dataType": ["text"]},
                {"name": "file_path", "dataType": ["string"]},
            ],
        }

        self.client.schema.create_class(schema)
        print(f"Schema for {class_name} created.")
        return class_name



    def upload_content(self, class_name: str, content: str, file_path: str):
        chunks = self.chunk_content(content)
        for chunk in tqdm(chunks, desc="Uploading content", unit="chunk"):
            data_object = {
                "content": chunk,
                "file_path": file_path,
            }
            self.client.data_object.create(data_object, class_name)

    def chunk_content(self, content: str, max_tokens: int = 2048) -> list:
        tokens = content.split()
        chunks = []
        current_chunk = []

        for token in tokens:
            if len(current_chunk) + len(token) + 1 > max_tokens:
                chunks.append(' '.join(current_chunk))
                current_chunk = [token]
            else:
                current_chunk.append(token)

        if current_chunk:
            chunks.append(' '.join(current_chunk))

        return chunks

    def get_context(self, query: str, company_name: str):
        company_name = self.sanitize_class_name(company_name)
        class_name = f"{company_name}_Documents"
        try:
            query_result = (
                self.client.query
                .get(class_name, ["content"])
                .with_near_text({"concepts": [query]})
                .with_limit(5)
                .do()
            )
            if 'data' in query_result and 'Get' in query_result['data']:
                return query_result['data']['Get'][class_name]
            else:
                print("Unexpected response structure:", query_result)
                return []
        except Exception as e:
            print(f"Error querying Weaviate: {e}")
            return []

    def register_company(self, company_name: str):
        return self.create_company_schema(company_name)

    def get_registered_companies(self):
        existing_classes = self.client.schema.get()["classes"]
        companies = [cls["class"].replace("_Documents", "").replace('_', ' ') for cls in existing_classes if "_Documents" in cls["class"]]
        return companies
