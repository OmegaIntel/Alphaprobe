
import uuid
import os
import json
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import boto3
from tempfile import NamedTemporaryFile
from io import BytesIO

from db_models.financial_model import FinancialModel
from db.db_session import get_db
from apis.api_get_current_user import get_current_user
from db_models.users import User as UserModel

# Import helper modules
from services.financial_model.financial_model_helpers import (
    process_file, extract_workbook_structure, find_standardized_cell_mapping, 
    update_template_with_new_data
)
from services.financial_model.prompt import call_openai, build_enhanced_mapping_prompt, create_fallback_mapping

# S3 configuration
FINANCIAL_MODEL_BUCKET = "financial-model-files"
s3 = boto3.client(
    "s3",
    aws_access_key_id=os.environ["S3_ACCESS_KEY"],
    aws_secret_access_key=os.environ["S3_SECRET_KEY"],
    region_name=os.environ["S3_REGION"]
)

router = APIRouter()

@router.get("/api/financial-models/presigned-url")
def get_presigned_url(s3_key: str, db: Session = Depends(get_db)):
    try:
        url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': FINANCIAL_MODEL_BUCKET, 'Key': s3_key},
            ExpiresIn=600  # 10 minutes
        )
        return {"url": url}
    except Exception as e:
        print(f"[❌] Failed to generate signed URL: {e}")
        raise HTTPException(status_code=500, detail="Unable to generate download link")

@router.post("/api/financial-models/upload")
async def upload_financial_model(
    company_name: str = Form(...),
    is_initial_upload: bool = Form(...),
    file: UploadFile = File(...),
    reference_model_id: Optional[str] = Form(None),
    note: Optional[str] = Form(None),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        print("🔁 Starting upload process with full sheet analysis...")
        user_id = current_user.id
        print(f"👤 User ID: {user_id}")

        # Read the file content
        file_content = file.file.read()
        file_ext = os.path.splitext(file.filename)[-1].lower()
        
        # Check file type
        if file_ext not in [".xlsx", ".xls", ".csv"]:
            raise HTTPException(status_code=400, detail="Only Excel (.xlsx, .xls) and CSV files are supported")

        # Use the enhanced upload processing function that analyzes all sheets
        from services.financial_model.full_sheet_analysis import upload_financial_model_with_full_analysis
        
        try:
            # Process with all sheets analyzed
            result = await upload_financial_model_with_full_analysis(
                company_name=company_name,
                is_initial_upload=is_initial_upload,
                file_content=file_content,
                file_filename=file.filename,
                reference_model_id=reference_model_id,
                note=note,
                user_id=user_id,
                db=db,
                s3=s3
            )
        except Exception as e:
            print(f"Error in full sheet analysis: {str(e)}")
            # Fall back to original implementation if the enhanced version fails
            from services.financial_model.enhanced_template_processing import upload_financial_model_enhanced
            
            print("Falling back to standard implementation with limited sheet analysis...")
            result = await upload_financial_model_enhanced(
                company_name=company_name,
                is_initial_upload=is_initial_upload,
                file_content=file_content,
                file_filename=file.filename,
                reference_model_id=reference_model_id,
                note=note,
                user_id=user_id,
                db=db,
                s3=s3
            )
        
        # Create a new database record
        new_model = FinancialModel(
            user_id=user_id,
            company_name=company_name,
            original_file_s3=result["original_file_s3"],
            updated_model_s3=result["updated_model_s3"],
            is_initial_upload=is_initial_upload,
            model_group_id=result["model_group_id"],
            note=note,
            mapping_json=result["mapping_json"]
        )
        db.add(new_model)
        db.commit()
        db.refresh(new_model)

        # For initial uploads, set the model_group_id to its own ID
        if is_initial_upload:
            new_model.model_group_id = new_model.id
            db.add(new_model)
            db.commit()

        return {
            "message": "File uploaded and processed successfully with complete sheet analysis",
            "data": {
                "id": str(new_model.id),
                "company_name": new_model.company_name,
                "original_file_s3": new_model.original_file_s3,
                "updated_model_s3": new_model.updated_model_s3,
                "model_group_id": str(new_model.model_group_id) if new_model.model_group_id else None,
                "is_initial_upload": new_model.is_initial_upload,
                "updates_applied": result["updates_applied"],
                "sheets_analyzed": len(result["mapping_json"].get("sheets", {})) if is_initial_upload else 
                                   len(result["mapping_json"].get("update_file_mapping", {}).get("sheets", {})),
                "cross_sheet_formulas": {
                    "dependencies_found": "cross_sheet_dependencies" in result["mapping_json"].get("workbook_properties", {}) if is_initial_upload else 
                                          result["mapping_json"].get("cross_sheet_impact", {}).get("total_impacted_cells", 0) > 0,
                    "impacted_cells": result["mapping_json"].get("cross_sheet_impact", {}).get("total_impacted_cells", 0) if not is_initial_upload else 0,
                    "impacted_sheets": result["mapping_json"].get("cross_sheet_impact", {}).get("impacted_sheets", []) if not is_initial_upload else []
                }
            }
        }

    except Exception as e:
        print(f"🔥 Error during upload: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/api/financial-models/group/{model_group_id}")
def get_models_by_group(model_group_id: str, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    try:
        # Log the incoming ID for debugging
        print(f"Received model_group_id: {model_group_id}, type: {type(model_group_id)}")
        
        # Convert string model_group_id to UUID
        uuid_model_group_id = uuid.UUID(model_group_id)
        
        # Query with the converted UUID - exclude mapping_json column
        models = db.query(
            FinancialModel.id,
            FinancialModel.user_id,
            FinancialModel.company_name,
            FinancialModel.model_group_id,
            FinancialModel.original_file_s3,
            FinancialModel.updated_model_s3,
            FinancialModel.is_initial_upload,
            FinancialModel.note,
            FinancialModel.created_at,
            FinancialModel.updated_at
        ).filter(
            FinancialModel.model_group_id == uuid_model_group_id
        ).order_by(FinancialModel.created_at.asc()).all()
        
        # Prepare result list
        result_models = []
        
        for m in models:
            updates_applied = 0
            
            # Only fetch mapping_json for non-initial upload models
            if not m.is_initial_upload:
                try:
                    # Fetch just the mapping_json column for this specific model
                    mapping_data = db.query(FinancialModel.mapping_json).filter(
                        FinancialModel.id == m.id
                    ).first()
                    
                    if mapping_data and mapping_data.mapping_json and isinstance(mapping_data.mapping_json, dict):
                        updates_applied = len(mapping_data.mapping_json.get("updated_cells", []))
                except Exception as e:
                    print(f"Error fetching mapping_json for model {m.id}: {str(e)}")
            
            # Add to results
            result_models.append({
                "id": str(m.id),
                "company_name": m.company_name,
                "original_file_s3": m.original_file_s3,
                "updated_model_s3": m.updated_model_s3,
                "created_at": m.created_at.isoformat(),
                "is_initial_upload": m.is_initial_upload,
                "note": m.note,
                "updates_applied": updates_applied
            })
        
        return {"models": result_models}
        
    except ValueError as e:
        print(f"Invalid UUID format: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid model group ID format")
    except Exception as e:
        print(f"Error in get_models_by_group: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve models: {str(e)}")
    
@router.get("/api/financial-models/list")
def list_models(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    try:
        # Get user ID as string
        user_id_str = current_user.id  # This is already a string from get_current_user
        print(f"Looking for models with user_id: {user_id_str}")
        
        # Use string comparison with manual filter for safer results
        all_models = db.query(FinancialModel).all()
        
        # Filter manually (bypassing any ORM type conversion issues)
        user_models = []
        for model in all_models:
            if str(model.user_id) == user_id_str and model.is_initial_upload:
                user_models.append({
                    "id": str(model.id),
                    "company_name": model.company_name,
                    "original_file_s3": model.original_file_s3,
                    "updated_model_s3": model.updated_model_s3,
                    "created_at": model.created_at.isoformat(),
                    "is_initial_upload": model.is_initial_upload,
                    "model_group_id": str(model.model_group_id) if model.model_group_id else None,
                    "note": model.note
                })
        
        print(f"Final response has {len(user_models)} models")
        return {"models": user_models}
    except Exception as e:
        print(f"Error in list_models: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to retrieve models list: {str(e)}")

@router.get("/api/financial-models/{id}")
def get_model(id: str, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    try:
        # Log the incoming ID for debugging
        print(f"Received model id: {id}, type: {type(id)}")
        
        # Convert string id to UUID
        model_id = uuid.UUID(id)
        
        # Query with the converted UUID
        model = db.query(FinancialModel).filter(FinancialModel.id == model_id).first()
        
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
            
        return {
            "id": str(model.id),
            "company_name": model.company_name,
            "original_file_s3": model.original_file_s3,
            "updated_model_s3": model.updated_model_s3,
            "is_initial_upload": model.is_initial_upload,
            "model_group_id": str(model.model_group_id) if model.model_group_id else None,
            "created_at": model.created_at.isoformat(),
            "note": model.note,
            "updates_applied": len(model.mapping_json.get("updated_cells", [])) if not model.is_initial_upload and isinstance(model.mapping_json, dict) else 0
        }
    except ValueError as e:
        print(f"Invalid UUID format: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid model ID format")
    except Exception as e:
        print(f"Error in get_model: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve model: {str(e)}")


@router.delete("/api/financial-models/{id}")
def delete_model(id: str, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    try:
        # Log the incoming ID for debugging
        print(f"Received model id for deletion: {id}, type: {type(id)}")
        
        # Convert string id to UUID
        model_id = uuid.UUID(id)
        
        # Query with the converted UUID
        model = db.query(FinancialModel).filter(FinancialModel.id == model_id).first()
        
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
            
        db.delete(model)
        db.commit()
        return {"message": "Model deleted successfully"}
    except ValueError as e:
        print(f"Invalid UUID format: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid model ID format")
    except Exception as e:
        print(f"Error in delete_model: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete model: {str(e)}")