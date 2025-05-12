import logging
from typing import Dict, Any, List

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("enhanced_prompt_building")

def build_enhanced_mapping_prompt_v2(workbook_data: Dict[str, Any], is_initial_upload: bool) -> str:
    """
    Build an advanced prompt for OpenAI to help map the financial model structure.
    This version is designed to work with the chunking approach for analyzing all sheets.
    
    Args:
        workbook_data: The extracted workbook structure information for the current chunk
        is_initial_upload: Whether this is an initial template upload or an update
        
    Returns:
        Prompt string for the AI
    """
    # Get the sheet names in this chunk
    sheet_names = list(workbook_data["sheets"].keys())
    total_workbook_sheets = workbook_data["workbook_properties"].get("sheet_count", len(sheet_names))
    
    logger.info(f"Building prompt for {len(sheet_names)} sheets (out of {total_workbook_sheets} total)")
    
    # Generate sheet information sections
    sheets_info = []
    for sheet_name in sheet_names:
        sheet_info = generate_sheet_info(workbook_data, sheet_name)
        sheets_info.append(sheet_info)
    
    # Different prompt based on whether this is an initial upload or update
    if is_initial_upload:
        # For initial uploads, we want a comprehensive analysis of the structure
        prompt = f"""
You are a financial analyst. Analyze this financial model Excel structure:

Excel workbook data (analyzing {len(sheet_names)} sheets out of {total_workbook_sheets} total sheets):

{"="*30}
{"\n\n".join(sheets_info)}
{"="*30}

This is an INITIAL UPLOAD that will serve as a TEMPLATE for future updates.
Provide a mapping of financial metrics and their locations for the sheets shown above.

Return ONLY a JSON object with this structure:
{{
  "sheets": {{
    "<sheet_name>": {{
      "sheet_properties": {{
        "type": "<income_statement|balance_sheet|cash_flow|assumptions|detail|projection|unknown>",
        "time_period": "<annual|monthly|quarterly>"
      }},
      "key_metrics": {{
        "<standardized_metric_name>": {{
          "source_column": "<original column name>",
          "found_in_cells": ["<cell references>"]
        }}
      }}
    }}
  }}
}}

Standard metrics by type:
- Income Statement: Revenue, COGS, Gross Profit, OpEx, EBITDA, Tax, Net Income
- Balance Sheet: Assets, Liabilities, Equity, Cash
- Cash Flow: Operating CF, Investing CF, Financing CF

ONLY return the JSON object focusing ONLY on the sheets provided in this analysis chunk.
"""
    else:
        # For updates, we focus on mapping the data to the template
        prompt = f"""
You are a financial analyst. Analyze this financial data file:

Financial data (analyzing {len(sheet_names)} sheets out of {total_workbook_sheets} total sheets):

{"="*30}
{"\n\n".join(sheets_info)}
{"="*30}

This is an UPDATE FILE containing new financial data that needs to be mapped to a template.
Focus on identifying the financial metrics and their values for the sheets shown above.

Return ONLY a JSON object with this structure:
{{
  "sheets": {{
    "<sheet_name>": {{
      "metrics": {{
        "<standardized_metric_name>": {{
          "source_column": "<original column name>",
          "sample_value": <value from sample row>
        }}
      }}
    }}
  }}
}}

Standard metrics to look for:
- Revenue, COGS, Gross Profit, OpEx, EBITDA, Tax, Net Income
- Assets, Liabilities, Equity, Cash
- Operating CF, Investing CF, Financing CF

ONLY return the JSON object focusing ONLY on the sheets provided in this analysis chunk.
"""
    
    return prompt.strip()

def generate_sheet_info(workbook_data: Dict[str, Any], sheet_name: str) -> str:
    """
    Generate information about a specific sheet for the AI prompt.
    Enhanced version with more useful data extraction.
    
    Args:
        workbook_data: The extracted workbook structure information
        sheet_name: The name of the sheet to generate info for
        
    Returns:
        String containing formatted sheet information
    """
    sheet_data = workbook_data["sheets"][sheet_name]
    sheet_type = sheet_data["sheet_properties"]["type"]
    
    sheet_info = [
        f"Sheet name: {sheet_name}",
        f"Sheet type: {sheet_type}",
        f"Sheet dimensions: {sheet_data['sheet_properties'].get('dimensions', 'Unknown')}"
    ]
    
    # Add headers information (include all headers for better analysis)
    if "headers" in sheet_data and sheet_data["headers"]:
        sheet_info.append("\nColumn headers:")
        headers = sheet_data["headers"]
        # Group headers in sets of 5 for readability
        for i in range(0, len(headers), 5):
            header_group = headers[i:i+5]
            header_line = ", ".join([str(h) for h in header_group if h])
            if header_line:
                sheet_info.append(f"- {header_line}")
    
    # Add sample values if available (up to 5 values for context)
    if "sample_values" in sheet_data and sheet_data["sample_values"]:
        sheet_info.append("\nSample values (row 2):")
        for i, (header, value) in enumerate(zip(
            sheet_data["headers"][:5], 
            sheet_data["sample_values"][:5]
        )):
            if header and value is not None:  # Only include non-empty values
                sheet_info.append(f"- {header}: {value}")
    
    # Add formula information (limit to 5 formulas for context)
    if "formulas" in sheet_data and sheet_data["formulas"]:
        formula_items = list(sheet_data["formulas"].items())[:5]
        if formula_items:
            sheet_info.append("\nKey formulas:")
            for cell_ref, formula in formula_items:
                sheet_info.append(f"- Cell {cell_ref}: {formula}")
    
    # Add key cells information if available (limit to 5 for context)
    if "key_cells" in sheet_data and sheet_data["key_cells"]:
        key_cells_items = list(sheet_data["key_cells"].items())[:5]
        if key_cells_items:
            sheet_info.append("\nKey financial metric cells:")
            for cell_ref, cell_info in key_cells_items:
                metric = cell_info.get("metric", "Unknown")
                value = cell_info.get("cell_value", "N/A")
                sheet_info.append(f"- Cell {cell_ref}: {metric} = {value}")
    
    return "\n".join(sheet_info)