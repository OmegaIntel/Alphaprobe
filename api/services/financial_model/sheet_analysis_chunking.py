import json
from typing import Dict, Any, List, Tuple
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("sheet_analysis_chunking")

async def analyze_all_sheets_with_chunking(
    workbook_data: Dict[str, Any], 
    is_initial_upload: bool,
    call_openai_function, 
    build_prompt_function
) -> Dict[str, Any]:
    """
    Analyze all sheets in a workbook by chunking them into multiple AI requests.
    
    Args:
        workbook_data: Extracted workbook data containing sheet information
        is_initial_upload: Whether this is an initial upload (template) or update
        call_openai_function: Function to call OpenAI API
        build_prompt_function: Function to build prompts for a set of sheets
        
    Returns:
        Complete mapping of the workbook
    """
    # Extract all sheet names
    all_sheets = list(workbook_data["sheets"].keys())
    total_sheets = len(all_sheets)
    
    logger.info(f"Starting analysis of all {total_sheets} sheets with chunking")
    
    # Define max sheets per chunk (adjust based on token limits)
    max_sheets_per_chunk = 4  # Adjust this based on average sheet complexity
    
    # Calculate number of chunks needed
    chunks = [all_sheets[i:i + max_sheets_per_chunk] for i in range(0, total_sheets, max_sheets_per_chunk)]
    num_chunks = len(chunks)
    
    logger.info(f"Analysis will be performed in {num_chunks} chunks of max {max_sheets_per_chunk} sheets each")
    
    # Prepare to collect results
    combined_results = {}
    
    if is_initial_upload:
        # Initialize combined result structure for template
        combined_results = {
            "workbook_properties": {
                "sheet_count": total_sheets,
                "model_type": "financial_model"
            },
            "sheets": {}
        }
    else:
        # Initialize combined result structure for update file
        combined_results = {
            "file_type": workbook_data["workbook_properties"].get("file_type", "excel"),
            "sheets": {}
        }
    
    # Process each chunk
    for chunk_idx, chunk_sheets in enumerate(chunks):
        logger.info(f"Processing chunk {chunk_idx+1}/{num_chunks} with {len(chunk_sheets)} sheets")
        
        # Create subset of workbook data with only this chunk's sheets
        chunk_workbook_data = {
            "workbook_properties": workbook_data["workbook_properties"].copy(),
            "sheets": {sheet: workbook_data["sheets"][sheet] for sheet in chunk_sheets}
        }
        
        # Build prompt for this chunk
        chunk_prompt = build_prompt_function(chunk_workbook_data, is_initial_upload)
        
        # Call AI for analysis
        try:
            logger.info(f"Sending chunk {chunk_idx+1} to AI analysis")
            raw_chunk_mapping = await call_openai_function(chunk_prompt)
            chunk_mapping = json.loads(raw_chunk_mapping)
            logger.info(f"Successfully received analysis for chunk {chunk_idx+1}")
            
            # Merge chunk results into combined results
            if is_initial_upload:
                # Merge sheets for template analysis
                if "sheets" in chunk_mapping:
                    combined_results["sheets"].update(chunk_mapping["sheets"])
                    
                # Update workbook properties if provided
                if "workbook_properties" in chunk_mapping and "model_type" in chunk_mapping["workbook_properties"]:
                    combined_results["workbook_properties"]["model_type"] = chunk_mapping["workbook_properties"]["model_type"]
            else:
                # Merge sheets for update file analysis
                if "sheets" in chunk_mapping:
                    combined_results["sheets"].update(chunk_mapping["sheets"])
                    
                # Update file type if provided
                if "file_type" in chunk_mapping:
                    combined_results["file_type"] = chunk_mapping["file_type"]
                    
        except Exception as e:
            logger.error(f"Error analyzing chunk {chunk_idx+1}: {str(e)}")
            logger.warning(f"Skipping chunk {chunk_idx+1} due to analysis error")
            # Continue with other chunks rather than failing completely
    
    logger.info(f"Completed analysis of all {total_sheets} sheets in {num_chunks} chunks")
    logger.info(f"Final combined analysis has {len(combined_results.get('sheets', {}))} sheets")
    
    return combined_results

def merge_mapping_results(
    main_mapping: Dict[str, Any],
    new_mapping: Dict[str, Any],
    is_initial_upload: bool
) -> Dict[str, Any]:
    """
    Merge new mapping results into the main mapping.
    
    Args:
        main_mapping: The existing main mapping to update
        new_mapping: New mapping results to merge in
        is_initial_upload: Whether this is a template or update file
        
    Returns:
        Updated main mapping
    """
    if not main_mapping:
        return new_mapping
        
    if is_initial_upload:
        # For templates, merge sheet details
        if "sheets" in new_mapping:
            if "sheets" not in main_mapping:
                main_mapping["sheets"] = {}
                
            main_mapping["sheets"].update(new_mapping["sheets"])
            
        # Update workbook properties if provided
        if "workbook_properties" in new_mapping:
            if "workbook_properties" not in main_mapping:
                main_mapping["workbook_properties"] = {}
                
            for key, value in new_mapping["workbook_properties"].items():
                if key != "sheet_count":  # Preserve total sheet count
                    main_mapping["workbook_properties"][key] = value
    else:
        # For update files, merge metrics
        if "sheets" in new_mapping:
            if "sheets" not in main_mapping:
                main_mapping["sheets"] = {}
                
            for sheet_name, sheet_data in new_mapping["sheets"].items():
                if sheet_name not in main_mapping["sheets"]:
                    main_mapping["sheets"][sheet_name] = sheet_data
                elif "metrics" in sheet_data:
                    if "metrics" not in main_mapping["sheets"][sheet_name]:
                        main_mapping["sheets"][sheet_name]["metrics"] = {}
                        
                    main_mapping["sheets"][sheet_name]["metrics"].update(sheet_data["metrics"])
    
    return main_mapping