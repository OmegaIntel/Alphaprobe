import json
import os
import uuid
from datetime import datetime
from io import BytesIO
from typing import Dict, Any, List, Tuple, Optional

# Import existing modules
from services.financial_model.financial_model_helpers import (
    process_file, find_standardized_cell_mapping
)
from services.financial_model.prompt import call_openai, create_fallback_mapping

# Import the new chunking and prompt building modules
from services.financial_model.sheet_analysis_chunking import analyze_all_sheets_with_chunking
from services.financial_model.enhanced_prompt_building import build_enhanced_mapping_prompt_v2

# Import the Excel template preserver
from services.financial_model.excel_format_preservation import ExcelTemplatePreserver

# Import cross-sheet formula analyzer
from services.financial_model.cross_sheet_formula import analyze_workbook_with_cross_sheet_formulas, CrossSheetFormulaAnalyzer

import logging
# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("full_sheet_analysis")

# S3 bucket name
FINANCIAL_MODEL_BUCKET = "financial-model-files"

async def process_workbook_with_full_analysis(
    file_content: bytes,
    file_ext: str,
    is_initial_upload: bool
) -> Dict[str, Any]:
    """
    Process a workbook with full analysis of all sheets and cross-sheet formulas.
    
    Args:
        file_content: Binary content of the file
        file_ext: File extension (e.g., ".xlsx")
        is_initial_upload: Whether this is an initial template upload
        
    Returns:
        Complete mapping of the workbook including cross-sheet dependencies
    """
    try:
        # Process the file to extract structure and data
        workbook_data = process_file(file_content, file_ext)
        
        # Use chunking to analyze all sheets
        logger.info(f"Starting comprehensive analysis of all {len(workbook_data['sheets'])} sheets")
        
        # Call the chunking function to analyze all sheets
        mapping_json = await analyze_all_sheets_with_chunking(
            workbook_data,
            is_initial_upload,
            call_openai,
            build_enhanced_mapping_prompt_v2
        )
        
        logger.info("Successfully completed comprehensive analysis of all sheets")
        
        # Only perform cross-sheet formula analysis for Excel files, not CSVs
        if file_ext.lower() in ['.xlsx', '.xls']:
            logger.info("Starting cross-sheet formula analysis...")
            # Enhance the mapping with cross-sheet formula analysis
            enhanced_mapping = await analyze_workbook_with_cross_sheet_formulas(
                file_content, mapping_json, is_initial_upload
            )
            
            if "workbook_properties" in enhanced_mapping and "cross_sheet_dependencies" in enhanced_mapping["workbook_properties"]:
                num_dependencies = len(enhanced_mapping["workbook_properties"]["cross_sheet_dependencies"])
                logger.info(f"Cross-sheet formula analysis complete: Found dependencies for {num_dependencies} sheets")
                return enhanced_mapping
            else:
                logger.warning("Cross-sheet formula analysis didn't yield dependency information")
                return mapping_json
        else:
            logger.info("Skipping cross-sheet formula analysis for non-Excel file")
            return mapping_json
        
    except Exception as e:
        logger.error(f"Error in comprehensive workbook analysis: {str(e)}")
        
        # Fall back to simplified mapping
        logger.warning("Falling back to simplified mapping due to analysis error")
        workbook_data = process_file(file_content, file_ext)
        sample_sheet = list(workbook_data["sheets"].keys())[0] if workbook_data["sheets"] else "Sheet1"
        
        # Create a minimal prompt for the fallback
        fallback_prompt = f"""
        Analyze sheet: {sample_sheet}
        File type: {file_ext}
        Initial upload: {is_initial_upload}
        """
        
        fallback_mapping = json.loads(create_fallback_mapping(fallback_prompt))
        return fallback_mapping

async def upload_financial_model_with_full_analysis(
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
    Enhanced version of the financial model upload process that analyzes all sheets.
    
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
    # Initialize variables that will be needed in the return statement
    s3_key_original = None
    s3_key_updated = None
    model_group_id = None
    updated_cells = []
    mapping_json = {}
    
    try:
        logger.info("🔁 Starting enhanced upload process with full sheet analysis...")
        file_ext = os.path.splitext(file_filename)[-1].lower()
        
        # Check file type
        if file_ext not in [".xlsx", ".xls", ".csv"]:
            raise Exception("Only Excel (.xlsx, .xls) and CSV files are supported")
        
        # Process initial upload (template file)
        if is_initial_upload:
            logger.info("📁 Processing initial upload (template) with full sheet analysis...")
            
            # Process the file with full sheet analysis
            logger.info("🧠 Generating intelligent mapping of ALL sheets in the financial model...")
            mapping_json = await process_workbook_with_full_analysis(
                file_content, file_ext, is_initial_upload=True
            )
            
            # Upload the original file to S3
            s3_key_original = f"uploads/{user_id}/{str(uuid.uuid4())}_{file_filename}"
            s3.upload_fileobj(BytesIO(file_content), FINANCIAL_MODEL_BUCKET, s3_key_original)
            
            # For initial uploads, there's no updated model file yet
            s3_key_updated = None
            
        else:
            # This is an update to an existing model
            logger.info("🔄 Processing update with new financial data - full sheet analysis...")
            
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
            
            # Process the update file with full sheet analysis
            logger.info("🧠 Analyzing ALL sheets in update file to map new financial data...")
            update_file_mapping = await process_workbook_with_full_analysis(
                file_content, file_ext, is_initial_upload=False
            )
            
            # Download the template file from S3
            template_file_buffer = BytesIO()
            s3.download_fileobj(FINANCIAL_MODEL_BUCKET, reference_model.original_file_s3, template_file_buffer)
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
            logger.info("🔄 Updating template with new financial data while preserving all properties...")
            try:
                # First analyze cross-sheet formulas in the template to understand dependencies
                formula_analyzer = CrossSheetFormulaAnalyzer(template_file_content)
                formula_analyzer.analyze_all_cross_sheet_formulas()
                
                # Collect all cells that will be updated
                cells_to_update = []
                for metric_name, map_info in cell_mapping.items():
                    for sheet_info in update_file_mapping.get("sheets", {}).values():
                        if "metrics" in sheet_info and metric_name in sheet_info["metrics"]:
                            sheet = map_info["sheet"]
                            for cell_ref in map_info["cells"]:
                                cells_to_update.append(f"{sheet}!{cell_ref}")
                
                # Initialize impact_analysis as an empty dict in case the following code fails
                impact_analysis = {"total_impacted_cells": 0, "impacted_sheets": []}
                
                # Analyze the impact of these updates on cross-sheet formulas
                if cells_to_update:
                    impact_analysis = formula_analyzer.get_update_impact_analysis(cells_to_update)
                    
                    if impact_analysis["total_impacted_cells"] > 0:
                        logger.info(f"⚠️ Update will affect {impact_analysis['total_impacted_cells']} cells with cross-sheet formulas")
                        logger.info(f"⚠️ Impacted sheets: {', '.join(impact_analysis['impacted_sheets'])}")
                    else:
                        logger.info("✅ No cross-sheet formulas will be affected by this update")
                
                # Use our enhanced Excel template preserver to update the template
                updated_template_content, updated_cells = ExcelTemplatePreserver.process_template_update(
                    template_file_content, update_file_mapping, cell_mapping
                )
                
                if not updated_cells:
                    logger.warning("⚠️ No cells were updated in the template")
                else:
                    logger.info(f"✅ Updated {len(updated_cells)} cells in the template")
                    for update in updated_cells[:5]:  # Log first 5 updates
                        logger.info(f"  - {update}")
                    if len(updated_cells) > 5:
                        logger.info(f"  - ...and {len(updated_cells) - 5} more updates")
                
                # Save the updated template to S3
                s3_key_updated = f"updated-models/{user_id}/{datetime.utcnow().isoformat()}_{file_filename}"
                s3.upload_fileobj(BytesIO(updated_template_content), FINANCIAL_MODEL_BUCKET, s3_key_updated)
                
            except Exception as e:
                logger.error(f"❌ Error updating template: {str(e)}")
                raise Exception(f"Error updating template: {str(e)}")
            
            # Upload the original update file to S3 as well
            s3_key_original = f"uploads/{user_id}/{str(uuid.uuid4())}_{file_filename}"
            s3.upload_fileobj(BytesIO(file_content), FINANCIAL_MODEL_BUCKET, s3_key_original)
            
            # Create mapping JSON for the record
            mapping_json = {
                "reference_model_id": str(reference_model.id),
                "update_file_mapping": update_file_mapping,
                "cell_mapping": cell_mapping,
                "updated_cells": updated_cells[:20],  # Store first 20 updated cells for reference
                "cross_sheet_impact": {
                    "total_impacted_cells": impact_analysis.get("total_impacted_cells", 0) if 'impact_analysis' in locals() else 0,
                    "impacted_sheets": impact_analysis.get("impacted_sheets", []) if 'impact_analysis' in locals() else []
                }
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
        logger.error(f"🔥 Error during enhanced upload process: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Return the data we have so far, even if incomplete
        return {
            "original_file_s3": s3_key_original,
            "updated_model_s3": s3_key_updated,
            "mapping_json": mapping_json,
            "model_group_id": model_group_id,
            "updates_applied": len(updated_cells) if updated_cells else 0
        }