from pymongo import MongoClient, errors as pymongo_errors
import fitz
import os
from fastapi import UploadFile
from typing import List
from dotenv import load_dotenv
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from a .env file
load_dotenv()

# Retrieve environment variables
CONNECTION_STRING = os.getenv("CONNECTION_STRING")
DATABASE = os.getenv("DATABASE")
COLLECTION_NAME = os.getenv("COLLECTION")

if not all([CONNECTION_STRING, DATABASE, COLLECTION_NAME]):
    logger.error(
        "Missing one or more environment variables: CONNECTION_STRING, DATABASE, COLLECTION_NAME"
    )
    raise EnvironmentError("Missing required environment variables")


def extract_text_from_pdfs(files: List[UploadFile]) -> List[dict]:
    extracted_data = []
    for file in files:
        try:
            pdf_document = fitz.open(file)
            text = ""
            for page_num in range(pdf_document.page_count):
                page = pdf_document.load_page(page_num)
                text += page.get_text() + "\n"

            extracted_data.append(
                {
                    "file_name": os.path.basename(file),
                    "file_content": text,
                    "created_at": datetime.now().strftime("%Y-%m-%d"),
                }
            )
        except Exception as e:
            logger.error(f"Error processing file {file}: {e}")
    return extracted_data


def upload_to_mongodb(data: List[dict]):
    try:
        client = MongoClient(CONNECTION_STRING)
        db = client[DATABASE]
        collection = db[COLLECTION_NAME]

        insert_data = collection.insert_many(data)
        logger.info(
            f"Total number of inserted documents: {len(insert_data.inserted_ids)}"
        )
    except pymongo_errors.PyMongoError as e:
        logger.error(f"Error uploading data to MongoDB: {e}")


def process_pdf(files: List[UploadFile]):
    extracted_data = extract_text_from_pdfs(files)
    if extracted_data:
        upload_to_mongodb(extracted_data)
    else:
        logger.warning("No data extracted from PDFs")
