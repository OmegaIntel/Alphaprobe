import weaviate
from tqdm import tqdm
from werkzeug.security import generate_password_hash, check_password_hash


class WeaviateDb:
    def __init__(self, url: str = "http://weaviate:8080"):
        self.client = weaviate.Client(url)
        self.create_user_schema()

    def create_user_schema(self):
        class_name = "User"
        existing_classes = self.client.schema.get()["classes"]
        if any(cls["class"] == class_name for cls in existing_classes):
            return
        
        schema = {
            "classes": [
                {
                    "class": class_name,
                    "description": "User details",
                    "properties": [
                        {
                            "name": "email",
                            "dataType": ["string"]
                        },
                        {
                            "name": "password",
                            "dataType": ["string"]
                        }
                    ]
                }
            ]
        }
        self.client.schema.create(schema)

    def register_user(self, email: str, password: str):
        class_name = "User"
        hashed_password = generate_password_hash(password, method='sha256')
        
        user_data = {
            "email": email,
            "password": hashed_password
        }
        
        self.client.data_object.create(user_data, class_name)

    def authenticate_user(self, email: str, password: str):
        class_name = "User"
        query_result = self.client.query.get(class_name, ["email", "password"]).with_where({
            "path": ["email"],
            "operator": "Equal",
            "valueString": email
        }).do()
        
        if query_result["data"]["Get"][class_name]:
            user = query_result["data"]["Get"][class_name][0]
            if check_password_hash(user["password"], password):
                return True
        return False


    def create_schema(self, company: str):
        class_name = f"{company}_Documents"

        # Check if the schema already exists
        existing_classes = self.client.schema.get()["classes"]
        if any(cls["class"] == class_name for cls in existing_classes):
            print(f"Schema for {class_name} already exists.")
            return class_name

        # Define the schema
        schema = {
            "classes": [
                {
                    "class": class_name,
                    "description": f"Documents for {company}",
                    "vectorizer": "text2vec-openai",
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

        # Create the schema
        self.client.schema.create(schema)
        return class_name

    def chunk_content(self, content: str, max_tokens: int = 2048) -> list:
        # Simple chunking based on max tokens (This is a basic approach, further improvement might be required)
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

    def upload_content(self, class_name: str, content: str, file_path: str):
        chunks = self.chunk_content(content)
        for chunk in tqdm(chunks, desc="Uploading content", unit="chunk"):
            data_object = {
                "content": chunk,
                "file_path": file_path
            }
            self.client.data_object.create(data_object, class_name)

    def get_context(self, query: str, company: str):
        class_name = f"{company}_Documents"
        try:
            query_result = (
                self.client.query
                .get(class_name, ["content"])
                .with_near_text({"concepts": [query]})
                .with_limit(5)
                .do()
            )
            # Ensure the response contains the expected structure
            if 'data' in query_result and 'Get' in query_result['data']:
                return query_result['data']['Get'][class_name]
            else:
                print("Unexpected response structure:", query_result)
                return []
        except Exception as e:
            print(f"Error querying Weaviate: {e}")
            return []

    def register_company(self, company_name: str):
        class_name = f"{company_name}_Documents"
        existing_classes = self.client.schema.get()["classes"]
        if any(cls["class"] == class_name for cls in existing_classes):
            return False  # Company already registered
        self.create_schema(company_name)
        return True

    def get_registered_companies(self):
        existing_classes = self.client.schema.get()["classes"]
        companies = [cls["class"].replace("_Documents", "") for cls in existing_classes]
        return companies
