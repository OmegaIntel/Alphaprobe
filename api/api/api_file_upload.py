from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from db_models.deals import Deal
from db_models.file_upload import Document
from db_models.session import get_db
import os
import uuid
import json  

upload_file_router = APIRouter()

UPLOAD_DIRECTORY = "ENTER_UPLOAD_DIRECTORY_HERE"  

@upload_file_router.post("/upload")
async def upload_files(
    deal_id: uuid.UUID = Form(...),
    name: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    sub_category: str = Form(...),
    tags: list[str] = Form(...),  
    files: list[UploadFile] = File(...),  
    db: Session = Depends(get_db)
):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=400, detail="Deal not found")

    os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

    uploaded_documents = []

    for file in files:
        original_filename = file.filename
        
        sanitized_filename = original_filename.replace(" ", "_").replace("/", "_").replace("\\", "_")
        file_location = os.path.join(UPLOAD_DIRECTORY, sanitized_filename)

        try:
            # Save the uploaded file to the server
            with open(file_location, "wb") as f:
                f.write(await file.read())
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

        new_document = Document(
            name=name,
            description=description,
            category=category,
            sub_category=sub_category,
            tags=json.dumps(tags), 
            file_path=file_location,
            deal_id=deal_id
        )
        db.add(new_document)
        uploaded_documents.append(new_document)

    db.commit()

    for doc in uploaded_documents:
        db.refresh(doc)

    return {
        "message": "Files uploaded successfully",
        "documents": [{"id": doc.id, "name": doc.name, "file_path": doc.file_path} for doc in uploaded_documents]
    }


@upload_file_router.put("/documents/{document_id}")
async def update_document(
    document_id: str,  
    name: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    sub_category: str = Form(...),
    tags: list[str] = Form(...),
    db: Session = Depends(get_db)
):
    try:
        document_uuid = uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document ID format.")

    document = db.query(Document).filter(Document.id == document_uuid).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
    
    document.name = name
    document.description = description
    document.category = category
    document.sub_category = sub_category
    document.tags = json.dumps(tags)  
    db.commit()
    db.refresh(document)

    return {
        "message": "Document updated successfully.",
        "document": {
            "id": str(document.id),
            "name": document.name,
            "description": document.description
        }
    }


@upload_file_router.delete("/documents/{document_id}")
async def delete_document(document_id: str, db: Session = Depends(get_db)):
    try:
        document_uuid = uuid.UUID(document_id) 
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document ID format.")

    document = db.query(Document).filter(Document.id == document_uuid).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
    
    if os.path.exists(document.file_path):
        os.remove(document.file_path)
        db.delete(document)
    db.commit()

    return {"detail": "Document deleted successfully."}

@upload_file_router.get("/documents/{deal_id}")
async def get_uploaded_documents(deal_id: str, db: Session = Depends(get_db)):
    try:
        deal_uuid = uuid.UUID(deal_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid deal ID format.")

    documents = db.query(Document).filter(Document.deal_id == deal_uuid).all()
    if not documents:
        raise HTTPException(status_code=404, detail="No documents found for this deal ID.")
    
    return {
        "documents": [{"id": str(doc.id), "name": doc.name, "description": doc.description} for doc in documents]
    }


@upload_file_router.get("/documents/details/{document_id}")
async def get_document_details(document_id: str, db: Session = Depends(get_db)):
    try:
        document_uuid = uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document ID format.")

    document = db.query(Document).filter(Document.id == document_uuid).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
    
    return {
        "id": str(document.id),
        "name": document.name,
        "description": document.description,
        "category": document.category,
        "sub_category": document.sub_category,
        "tags": json.loads(document.tags)  
    }