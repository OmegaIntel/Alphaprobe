import json
import os
import uuid
from io import BytesIO
from datetime import datetime
from typing import Dict, Any, List, Tuple, Optional

# Import existing modules
from services.financial_model.financial_model_helpers import (
    process_file, find_standardized_cell_mapping
)
from services.financial_model.prompt import call_openai, build_enhanced_mapping_prompt, create_fallback_mapping

# Import the new Excel template preserver
from services.financial_model.excel_format_preservation import ExcelTemplatePreserver

async def upload_financial_model_enhanced(
    company_name: str,
    is_initial_upload: bool,
    file_content: bytes,
    file_filename: str,
    reference_model_id: Optional[str] = None,
    note: Optional[str] = None,
    user_id: str = None,
    db = None,
    s3 = None
):
    """
    Enhanced version of the financial model upload process that preserves all Excel formatting.
    
    Args:
        company_name: Name of the company
        is_initial_upload: True if this is an initial template upload, False for updates
        file_content: Binary content of the uploaded file
        file_filename: Filename of the uploaded file
        reference_model_id: ID of the reference model (required for updates)
        note: Optional note about the upload
        user_id: ID of the user uploading the file
        db: Database session
        s3: S3 client
        
    Returns:
        Dictionary containing the processing results
    """
    try:
        print("🔁 Starting enhanced upload process...")
        file_ext = os.path.splitext(file_filename)[-1].lower()
        
        # Check file type
        if file_ext not in [".xlsx", ".xls", ".csv"]:
            raise Exception("Only Excel (.xlsx, .xls) and CSV files are supported")

        model_group_id = None
        updated_cells = []
        
        # Process initial upload (template file)
        if is_initial_upload:
            print("📁 Processing initial upload (template)...")
            
            # Process the file to extract structure and data
            workbook_data = process_file(file_content, file_ext)
            
            # Generate AI-powered mapping of the template structure
            print("🧠 Generating intelligent mapping of financial model structure...")
            mapping_prompt = build_enhanced_mapping_prompt(workbook_data, is_initial_upload=True)
            
            try:
                raw_mapping = await call_openai(mapping_prompt)
                mapping_json = json.loads(raw_mapping)
                print("✅ Successfully generated enhanced mapping for template")
            except Exception as e:
                print(f"⚠️ Error in AI mapping: {str(e)}")
                print("⚠️ Using fallback structured mapping")
                mapping_json = json.loads(create_fallback_mapping(mapping_prompt))
            
            # Upload the original file to S3
            s3_key_original = f"uploads/{user_id}/{str(uuid.uuid4())}_{file_filename}"
            s3.upload_fileobj(BytesIO(file_content), "financial-model-files", s3_key_original)
            
            # For initial uploads, there's no updated model file yet
            s3_key_updated = None
            
        else:
            # This is an update to an existing model
            print("🔄 Processing update with new financial data...")
            
            if not reference_model_id:
                raise Exception("Reference model ID required for updates")

            # Convert reference_model_id string to UUID
            reference_model_uuid = uuid.UUID(reference_model_id)
            
            # Import the model dynamically to avoid circular imports
            from db_models.financial_model import FinancialModel
            
            reference_model = db.query(FinancialModel).filter(
                FinancialModel.id == reference_model_uuid,
                FinancialModel.is_initial_upload == True
            ).first()

            if not reference_model:
                raise Exception("Reference model not found")

            # Set the model group ID based on the reference model
            model_group_id = reference_model.id
            
            # Process the update file to extract data
            update_file_data = process_file(file_content, file_ext)
            
            # Generate AI mapping for the update file
            print("🧠 Analyzing update file to map new financial data...")
            update_mapping_prompt = build_enhanced_mapping_prompt(update_file_data, is_initial_upload=False)
            
            try:
                raw_update_mapping = await call_openai(update_mapping_prompt)
                update_file_mapping = json.loads(raw_update_mapping)
                print("✅ Successfully mapped update file data")
            except Exception as e:
                print(f"⚠️ Error in AI mapping for update file: {str(e)}")
                update_file_mapping = json.loads(create_fallback_mapping(update_mapping_prompt))
            
            # Download the template file from S3
            template_file_buffer = BytesIO()
            s3.download_fileobj("financial-model-files", reference_model.original_file_s3, template_file_buffer)
            template_file_buffer.seek(0)
            template_file_content = template_file_buffer.read()
            
            # Get the reference model mapping from the database
            reference_mapping = reference_model.mapping_json
            if not reference_mapping:
                raise Exception("Reference model does not have valid mapping data")
            
            # Create a cell mapping based on the reference model
            cell_mapping = find_standardized_cell_mapping(reference_mapping, update_file_mapping)
            
            if not cell_mapping:
                raise Exception("Could not create valid cell mapping between template and update file")
            
            # Update the template with new data, preserving all properties
            print("🔄 Updating template with new financial data while preserving all properties...")
            try:
                # Use our enhanced Excel template preserver to update the template
                updated_template_content, updated_cells = ExcelTemplatePreserver.process_template_update(
                    template_file_content, update_file_mapping, cell_mapping
                )
                
                if not updated_cells:
                    print("⚠️ No cells were updated in the template")
                else:
                    print(f"✅ Updated {len(updated_cells)} cells in the template")
                    for update in updated_cells[:5]:  # Print first 5 updates
                        print(f"  - {update}")
                    if len(updated_cells) > 5:
                        print(f"  - ...and {len(updated_cells) - 5} more updates")
                
                # Save the updated template to S3
                s3_key_updated = f"updated-models/{user_id}/{datetime.utcnow().isoformat()}_{file_filename}"
                s3.upload_fileobj(BytesIO(updated_template_content), "financial-model-files", s3_key_updated)
                
            except Exception as e:
                print(f"❌ Error updating template: {str(e)}")
                raise Exception(f"Error updating template: {str(e)}")
            
            # Upload the original update file to S3 as well
            s3_key_original = f"uploads/{user_id}/{str(uuid.uuid4())}_{file_filename}"
            s3.upload_fileobj(BytesIO(file_content), "financial-model-files", s3_key_original)
            
            # Create mapping JSON for the record
            mapping_json = {
                "reference_model_id": str(reference_model.id),
                "update_file_mapping": update_file_mapping,
                "cell_mapping": cell_mapping,
                "updated_cells": updated_cells[:20]  # Store first 20 updated cells for reference
            }

        # Return the necessary data for database operations
        return {
            "original_file_s3": s3_key_original,
            "updated_model_s3": s3_key_updated,
            "mapping_json": mapping_json,
            "model_group_id": model_group_id,
            "updates_applied": len(updated_cells) if updated_cells else 0
        }

    except Exception as e:
        print(f"🔥 Error during enhanced upload process: {str(e)}")
        import traceback
        traceback.print_exc()
        raise Exception(f"Upload failed: {str(e)}")