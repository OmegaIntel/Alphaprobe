from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

# Retrieve environment variables
CONNECTION_STRING = os.getenv("CONNECTION_STRING")
DATABASE = os.getenv("DATABASE")
COLLECTION_NAME = os.getenv("COLLECTION")


def get_database_connection(connection_string: str):
    """Establish a connection to the MongoDB database."""
    return MongoClient(connection_string)


def read_db_data():
    """Read data from the specified MongoDB collection."""
    client = get_database_connection(CONNECTION_STRING)
    db = client[DATABASE]
    collection = db[COLLECTION_NAME]
    documents = collection.find()

    pdf_data_list = []
    for doc in documents:
        pdf_data_list.append(doc)

    return pdf_data_list
