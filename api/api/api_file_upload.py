import os
import uuid
import json
import logging
from typing import Optional, List

import boto3
from botocore.exceptions import NoCredentialsError
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import datetime

from db_models.deals import Deal
from db_models.file_upload import Document
from db_models.session import get_db
from api.api_user import get_current_user, bypass_user, User as UserModelSerializer

# Import the OpenSearch manager (make sure the path matches your structure)
from db_models.OpensearchDB import OpenSearchManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

upload_file_router = APIRouter()

# S3 configuration (ensure these exist in your environment)
S3_BUCKET = os.environ["S3_BUCKET"]
S3_REGION = os.environ["S3_REGION"]
S3_ACCESS_KEY = os.environ["S3_ACCESS_KEY"]
S3_SECRET_KEY = os.environ["S3_SECRET_KEY"]

# Create an S3 client
s3 = boto3.client(
    "s3",
    aws_access_key_id=S3_ACCESS_KEY,
    aws_secret_access_key=S3_SECRET_KEY,
    region_name=S3_REGION
)

# Initialize OpenSearch manager
opensearch_manager = OpenSearchManager()


def sanitize_class_name(name: str) -> str:
    """
    Sanitize the collection name to be alphanumeric and lowercased
    (OpenSearch index names typically must be lowercase).
    """
    sanitized = ''.join(e for e in name if e.isalnum()).lower()
    return sanitized


@upload_file_router.post("/api/upload")
async def upload_files(
    deal_id: uuid.UUID = Form(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    sub_category: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    files: List[UploadFile] = File(...),
    current_user: UserModelSerializer = Depends(bypass_user),
    db: Session = Depends(get_db)
):
    """
    Upload files to S3, store metadata in the database, and index content in OpenSearch.
    Expects a valid deal_id (deal is already created in a separate deals API).
    """
    # Validate deal_id
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        logger.error(f"Deal not found: {deal_id}")
        raise HTTPException(status_code=400, detail="Deal not found")

    uploaded_documents = []

    # Process each file
    for file in files:
        original_filename = file.filename
        existing_document = db.query(Document).filter(
            Document.deal_id == deal_id,
            Document.original_filename == original_filename
        ).first()

        if existing_document:
            logger.error(f"File already exists in deal {deal_id}: {original_filename}")
            raise HTTPException(
                status_code=400,
                detail=f"A file named '{original_filename}' already exists in this deal."
            )

        # Sanitize and generate a unique file path based on userID/dealID/filename
        user_id = current_user.id
        sanitized_filename = original_filename.replace(" ", "_").replace("/", "_").replace("\\", "_")
        file_location = f"{user_id}/{deal_id}/{sanitized_filename}"

        # Upload file to S3
        try:
            s3.upload_fileobj(
                file.file,      # File-like object
                S3_BUCKET,      # S3 bucket name
                file_location   # S3 file path
            )
            logger.info(f"File uploaded to S3: {file_location}")
        except NoCredentialsError:
            logger.error("S3 credentials not available")
            raise HTTPException(status_code=500, detail="S3 credentials not available")
        except Exception as e:
            logger.error(f"Failed to upload file to S3: {str(e)}")
            raise HTTPException(status_code=500, detail=f"File upload to S3 failed: {str(e)}")

        # Convert tags to JSON list
        if tags:
            tags_list = [tag.strip() for tag in tags.split(",") if tag.strip().lower() != "null"]
            tags = json.dumps(tags_list) if tags_list else None
        else:
            tags = None

        # Create a new document record
        new_document = Document(
            name=name,
            description=description,
            category=category,
            sub_category=sub_category,
            tags=tags,
            file_path=file_location,
            deal_id=deal_id,
            original_filename=original_filename
        )
        db.add(new_document)
        uploaded_documents.append(new_document)

    # Update deal timestamp
    deal.updated_at = func.current_timestamp()
    db.add(deal)

    # Commit the DB transaction
    try:
        db.commit()
        logger.info(f"Documents added to database for deal {deal_id}")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to commit DB transaction: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save document metadata.")

    # Generate presigned URLs and index documents in OpenSearch
    for doc in uploaded_documents:
        try:
            presigned_url = s3.generate_presigned_url(
                'get_object',
                Params={'Bucket': S3_BUCKET, 'Key': doc.file_path},
                ExpiresIn=86400  # 24 hours
            )
            logger.info(f"Generated presigned URL for document {doc.id}")
        except Exception as e:
            logger.error(f"Failed to generate presigned URL: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error generating presigned URL: {str(e)}")

        # Determine collection name (index) based on user role / deal ID
        try:
            if current_user and current_user.is_admin:
                collection_name = "dadmin"
            else:
                collection_name = f"d{str(deal_id)}"
        except HTTPException as auth_exception:
            # Fallback if user is not authenticated
            if auth_exception.status_code == 401:
                collection_name = f"d{str(deal_id)}"
                logger.warning(f"Authentication failed, using fallback collection name: {collection_name}")
            else:
                raise auth_exception

        collection_name = sanitize_class_name(collection_name)

        # Index document in OpenSearch
        try:
            result = await opensearch_manager.create_collection(
                collection_name, str(doc.id), presigned_url
            )
            logger.info(f"Document indexed in OpenSearch: {doc.id} => {result}")
        except Exception as e:
            logger.error(f"Failed to index document in OpenSearch: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to index document in OpenSearch: {str(e)}")

    return {
        "message": "Files uploaded and indexed successfully",
        "documents": [
            {
                "id": doc.id,
                "name": doc.name,
                "file_path": f"s3://{S3_BUCKET}/{doc.file_path}"
            }
            for doc in uploaded_documents
        ]
    }


@upload_file_router.put("/api/documents/{document_id}")
async def update_document(
    document_id: str,
    name: str = Form(...),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    sub_category: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Update metadata for an existing document (name, description, category, sub_category, tags).
    """
    # Validate UUID
    try:
        document_uuid = uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document ID format.")

    # Fetch document
    document = db.query(Document).filter(Document.id == document_uuid).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Convert comma-separated tags to JSON
    if tags:
        tags_list = [tag.strip() for tag in tags.split(",") if tag.strip().lower() != "null"]
        tags = json.dumps(tags_list) if tags_list else None
    else:
        tags = None

    # Update document
    document.name = name
    document.description = description
    document.category = category
    document.sub_category = sub_category
    document.tags = tags

    # Update deal timestamp
    deal = db.query(Deal).filter(Deal.id == document.deal_id).first()
    if deal:
        deal.updated_at = func.current_timestamp()
        db.add(deal)

    # Commit changes
    try:
        db.commit()
        db.refresh(document)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update document: {str(e)}")

    # Return updated document info
    return {
        "message": "Document updated successfully.",
        "document": {
            "id": str(document.id),
            "name": document.name,
            "description": document.description,
            "category": document.category,
            "sub_category": document.sub_category,
            "tags": json.loads(document.tags) if document.tags else None
        }
    }


@upload_file_router.delete("/api/documents/{document_id}")
async def delete_document(document_id: str, db: Session = Depends(get_db)):
    """
    Delete a document and its file from S3. 
    (Optionally, you can also delete from OpenSearch index if needed.)
    """
    try:
        document_uuid = uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document ID format.")

    document = db.query(Document).filter(Document.id == document_uuid).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Delete file from S3
    try:
        s3.delete_object(Bucket=S3_BUCKET, Key=document.file_path)
    except NoCredentialsError:
        raise HTTPException(status_code=500, detail="S3 credentials not available")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file from S3: {str(e)}")

    # Remove from DB
    db.delete(document)

    # Update deal timestamp
    deal = db.query(Deal).filter(Deal.id == document.deal_id).first()
    if deal:
        deal.updated_at = func.current_timestamp()
        db.add(deal)

    # Commit
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete the document: {str(e)}")

    # If you want to remove from OpenSearch, call opensearch_manager.delete_context(...) 
    # or a doc-level delete. That's optional, depending on your business logic.

    return {"detail": "Document deleted successfully."}


@upload_file_router.get("/api/documents/{deal_id}")
async def get_uploaded_documents(deal_id: str, db: Session = Depends(get_db)):
    """
    Fetch all documents for a given deal.
    """
    try:
        deal_uuid = uuid.UUID(deal_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid deal ID format.")

    documents = db.query(Document).filter(Document.deal_id == deal_uuid).all()
    if not documents:
        raise HTTPException(status_code=404, detail="No documents found for this deal ID.")

    def clean_value(value):
        return None if value == "null" else value

    return {
        "documents": [
            {
                "id": str(doc.id),
                "name": doc.name,
                "description": clean_value(doc.description),
            }
            for doc in documents
        ]
    }


@upload_file_router.get("/api/documents/details/{document_id}")
async def get_document_details(document_id: str, db: Session = Depends(get_db)):
    """
    Get detailed metadata for a specific document by UUID.
    """
    try:
        document_uuid = uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document ID format.")

    document = db.query(Document).filter(Document.id == document_uuid).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")

    def clean_value(value):
        return None if value == "null" else value

    tags = json.loads(document.tags) if document.tags else None
    cleaned_tags = [clean_value(tag) for tag in tags] if tags else None

    return {
        "id": str(document.id),
        "name": clean_value(document.name),
        "description": clean_value(document.description),
        "category": clean_value(document.category),
        "sub_category": clean_value(document.sub_category),
        "tags": cleaned_tags
    }
