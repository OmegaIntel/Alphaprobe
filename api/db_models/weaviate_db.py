import re
import hashlib
import datetime

import weaviate
from weaviate import Client

from weaviate.classes.query import Filter
import weaviate.classes as wvc
from weaviate.connect.v4 import UnexpectedStatusCodeError
from abc import ABC, abstractmethod

from tqdm import tqdm
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
from api.llm_models.llm import LLM
from llmsherpa.readers import LayoutPDFReader
from os import getenv
from typing import List, Tuple
from api.interfaces import Retriever

from dotenv import load_dotenv

load_dotenv()


WEAVIATE_HOST = 'weaviate'
WEAVIATE_PORT = 8080
WEAVIATE_GRPC_PORT = 50051

WEAVIATE_URL = f"http://{WEAVIATE_HOST}:{WEAVIATE_PORT}"


class WeaviateDbRetriever(Retriever):
    def __init__(self, url=WEAVIATE_URL):
        self.client = Client(url=url)
        self.llm = LLM()

    def _hash_email(self, email: str) -> str:
        """Generate a hash of the email to use in class names."""
        return hashlib.md5(email.encode()).hexdigest()

    def _class_name(self, company_name: str, user_email: str) -> str:
        """Return standard class name."""
        sanitized_name = re.sub(r'\W+', '_', company_name).capitalize()
        email_hash = self._hash_email(user_email)
        return f"{sanitized_name}_{email_hash}_Documents"

    def create_company_schema(self, company_name: str, user_email: str):
        class_name = self._class_name(company_name, user_email)

        if self.client.schema.exists(class_name):
            print(f"Schema for {class_name} already exists.")
            return class_name

        schema = {
            "class": class_name,
            "description": f"Documents for {company_name} associated with {user_email}",
            "vectorizer": "text2vec-openai",
            "properties": [
                {"name": "content", "dataType": ["text"]},
                {"name": "file_path", "dataType": ["text"]},
                {"name": "user_email", "dataType": ["text"]},
            ],
        }

        self.client.schema.create_class(schema)
        print(f"Schema for {class_name} created.")
        return class_name

    def get_file_chunks(self, file_path: str) -> List[str]:
        """Use LLM Sherpa to chunk the file into pieces (paragraphs, for now)."""
        reader = LayoutPDFReader(getenv('LLMSHERPA_API_URL'))
        doc = reader.read_pdf(file_path)
        chunks = []
        for para in doc.chunks():
            try:
                chunks.append(para.to_context_text())
            except:
                chunks.append(para.to_text())
        return chunks

    def upload_content(self, class_name: str, file_path: str, user_email: str):
        chunks = self.get_file_chunks(file_path)
        for chunk in tqdm(chunks, desc="Uploading content", unit="chunk"):
            data_object = {
                "content": chunk,
                "file_path": file_path,
                "user_email": user_email,  # Associate the file content with the user
            }
            self.client.data_object.create(data_object, class_name)

    def get_context(self, query: str, company_name: str, user_email: str):
        class_name = self.class_name(company_name, user_email)
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

    def get_registered_companies(self, user_email: str):
        # Generate the hash of the current user's email
        hashed_email = self._hash_email(user_email)

        existing_classes = self.client.schema.get()["classes"]
        companies = []

        for cls in existing_classes:
            # Check if the class name contains the hashed email and "_Documents"
            if "_Documents" in cls["class"] and hashed_email in cls["class"]:
                company_name = cls["class"].replace("_Documents", "").replace(f"_{hashed_email}", "").replace('_', ' ')
                companies.append(company_name)

        return companies

    def llm_context(self, user_query: str, company_name: str, user_email: str) -> str:
        """Implements the interface."""
        context = self.get_context(user_query, company_name, user_email)
        return ' '.join([res['content'] for res in context])


class WeaviateDbV3:
    def __init__(self, url=WEAVIATE_URL):
        # this is v3
        self.client = Client(url=url)


class WeaviateChatSessionDb(WeaviateDbV3):
    def __init__(self, url=WEAVIATE_URL):
        super().__init__(url)
        self.class_name = "ChatSession"
        self.create_chat_schema()
        
    def create_chat_schema(self):
        chat_session_class = {
            "class": "ChatSession",
            "description": "Chat session details",
            "properties": [
                {"name": "session_id", "dataType": ["text"]},
                {"name": "session_name", "dataType": ["text"]},
                {"name": "user_email", "dataType": ["text"]},
                {"name": "created_at", "dataType": ["date"]},  # Add the creation timestamp property
            ],
        }

        chat_message_class = {
            "class": "ChatMessage",
            "description": "Chat message details",
            "properties": [
                {"name": "session_id", "dataType": ["text"]},
                {"name": "role", "dataType": ["text"]},
                {"name": "content", "dataType": ["text"]},
            ],
        }

        if not self.client.schema.exists("ChatSession"):
            self.client.schema.create_class(chat_session_class)

        if not self.client.schema.exists("ChatMessage"):
            self.client.schema.create_class(chat_message_class)

    def create_chat_session(self, user_email: str) -> Tuple[str, str]:
        session_id = str(uuid.uuid4())
        session_name = f"Session {session_id[:8]}"
        timestamp = datetime.datetime.utcnow().isoformat() + 'Z'  # Weaviate uses ISO format for date-time

        session_data = {
            "session_id": session_id,
            "session_name": session_name,
            "user_email": user_email,
            "created_at": timestamp  # Add the creation timestamp
        }
        self.client.data_object.create(session_data, "ChatSession")
        return session_id, session_name


    def get_chat_sessions(self, user_email: str):
        query_result = self.client.query.get("ChatSession", ["session_id", "session_name", "created_at"]).with_where({
            "path": ["user_email"],
            "operator": "Equal",
            "valueString": user_email,
        }).with_sort({
            "path": ["created_at"],
            "order": "desc"
        }).do()

        return query_result["data"]["Get"]["ChatSession"]


    def get_chat_session(self, session_id: str, user_email: str):
        query_result = self.client.query.get("ChatSession", ["session_id", "session_name"]).with_where({
            "operator": "And",
            "operands": [
                {
                    "path": ["session_id"],
                    "operator": "Equal",
                    "valueString": session_id,
                },
                {
                    "path": ["user_email"],
                    "operator": "Equal",
                    "valueString": user_email,
                }
            ]
        }).do()

        if query_result["data"]["Get"]["ChatSession"]:
            return query_result["data"]["Get"]["ChatSession"][0]
        return None

    def get_chat_messages(self, session_id: str, user_email: str):
        session = self.get_chat_session(session_id, user_email)
        if session is None:
            return None

        query_result = self.client.query.get("ChatMessage", ["role", "content"]).with_where({
            "path": ["session_id"],
            "operator": "Equal",
            "valueString": session_id,
        }).do()

        return query_result["data"]["Get"]["ChatMessage"]
    
    def delete_chat_session(self, session_id: str, user_email: str):
        # Query Weaviate to get the UUID for the session with the given session_id
        query_result = self.client.query.get("ChatSession", ["_additional { id }"]).with_where({
            "path": ["session_id"],
            "operator": "Equal",
            "valueString": session_id,
        }).do()

        # Extract the UUID from the query result
        if query_result and query_result["data"]["Get"]["ChatSession"]:
            session_uuid = query_result["data"]["Get"]["ChatSession"][0]["_additional"]["id"]

            # Delete the session using the UUID
            try:
                self.client.data_object.delete(session_uuid, "ChatSession")
                return {"message": "Session deleted successfully"}
            except weaviate.exceptions.UnexpectedStatusCodeException as e:
                print(f"Error deleting session: {e}")
                return {"error": "Failed to delete session"}
        else:
            return {"error": "Session not found"}

    def save_chat_message(self, session_id: str, user_message: dict, ai_message: dict, user_email: str):
        session = self.get_chat_session(session_id, user_email)
        if session is None:
            return None

        user_message_data = {
            "session_id": session_id,
            "role": user_message["role"],
            "content": user_message["content"],
        }

        ai_message_data = {
            "session_id": session_id,
            "role": ai_message["role"],
            "content": ai_message["content"],
        }

        self.client.data_object.create(user_message_data, "ChatMessage")
        self.client.data_object.create(ai_message_data, "ChatMessage")

    def update_chat_session_name(self, session_id: str, session_name: str):
        # Query Weaviate to get the UUID for the session with the given session_id
        query_result = self.client.query.get("ChatSession", ["_additional { id }"]).with_where({
            "path": ["session_id"],
            "operator": "Equal",
            "valueString": session_id,
        }).do()

        # Extract the UUID from the query result
        if query_result and query_result["data"]["Get"]["ChatSession"]:
            session_uuid = query_result["data"]["Get"]["ChatSession"][0]["_additional"]["id"]

            # Update the session name using the UUID
            update_data = {
                "session_name": session_name
            }
            self.client.data_object.update(update_data, "ChatSession", session_uuid)


class WeaviateUserDb(WeaviateDbV3):
    def __init__(self, url=WEAVIATE_URL):
        super().__init__(url)
        self.class_name = 'User'
        self.create_user_schema()

    def create_user_schema(self):
        if self.client.schema.exists(self.class_name):
            return

        schema = {
            "class": self.class_name,
            "description": "User details",
            "properties": [
                {"name": "email", "dataType": ["text"]},
                {"name": "password", "dataType": ["text"]},
            ],
        }
        self.client.schema.create_class(schema)

    def register_user(self, email: str, hashed_password: str):
        user_data = {
            "email": email,
            "password": hashed_password,
        }
        self.client.data_object.create(user_data, self.class_name)

    def get_user(self, email: str):
        query_result = self.client.query.get(self.class_name, ["email", "password"]).with_where({
            "path": ["email"],
            "operator": "Equal",
            "valueString": email,
        }).do()

        if query_result["data"]["Get"][self.class_name]:
            return query_result["data"]["Get"][self.class_name][0]
        return None


class WeaviateDbV4(ABC):
    """Base v4 class"""

    class_name = ''

    def __init__(self, host=WEAVIATE_HOST, port=WEAVIATE_PORT, grpc_port=WEAVIATE_GRPC_PORT):
        self.client = weaviate.connect_to_local(
            host=host,
            port=port,
            grpc_port=grpc_port,
        )
        self.create_schema()

    def __del__(self):
        self.client.close()

    @abstractmethod
    def create_schema(self):
        assert self.class_name


class WeaviateIndustryDb(WeaviateDbV4):
    class_name = "IndustrySummary"

    def __init__(self, host='weaviate', port=8080, grpc_port=50051):
        super().__init__(host, port, grpc_port)

    def create_schema(self):
        """Create industry info schema from dict"""
        try:
            self.client.collections.create(
                name=self.class_name,
                # vectorizer_config=wvc.config.Configure.Vectorizer.text2vec_openai(),    # Set the vectorizer to "text2vec-openai" to use the OpenAI API for vector-related operations
                # generative_config=wvc.config.Configure.Generative.cohere(),             # Set the generative module to "generative-cohere" to use the Cohere API for RAG
                properties=[
                    wvc.config.Property(
                        name="source",
                        data_type=wvc.config.DataType.TEXT,
                    ),
                    wvc.config.Property(
                        name="type",
                        data_type=wvc.config.DataType.TEXT,
                    ),
                    wvc.config.Property(
                        name="subtype",
                        data_type=wvc.config.DataType.TEXT,
                    ),
                    wvc.config.Property(
                        name="industry_name",
                        data_type=wvc.config.DataType.TEXT,
                    ),
                    wvc.config.Property(
                        name="last_updated",
                        data_type=wvc.config.DataType.DATE,
                    ),
                    wvc.config.Property(
                        name="industry_summary",
                        data_type=wvc.config.DataType.OBJECT,
                    ),
                ]
            )
        except UnexpectedStatusCodeError:
            pass    # the schema exists already

    def add_industry_summary(self, summary: dict):
        for key in ["source", "type", "subtype", "industry_name", "last_updated", "industry_summary"]:
            assert key in summary, f"{key} is not present in the summary"
        print("GOT TYPE", type(summary['industry_summary']))
        # if isinstance(summary['industry_summary'], dict):
        #     summary['industry_summary'] = json.dumps(summary['industry_summary'])
        collection = self.client.collections.get(self.class_name)
        collection.data.insert(summary)

    def get_industry_summaries(self, **kwargs) -> List:
        summaries = self.client.collections.get(self.class_name)
        key_vals = list(kwargs.items())
        key, val = key_vals[0]
        f0 = Filter.by_property(key).equal(val)
        for key, val in key_vals[1:]:
            f0 = f0 & Filter.by_property(key).equal(val)
        response = summaries.query.fetch_objects(
            filters=f0,
            limit=5
        )
        return response
