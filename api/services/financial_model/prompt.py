import json
import os
import httpx
from typing import Dict, Any, List

# Import classification constants
from .financial_model_helpers import (
    SHEET_TYPE_PATTERNS, STANDARD_METRICS, METRIC_ALTERNATIVES
)

async def call_openai(prompt: str) -> str:
    """
    Call OpenAI API for AI model responses with automatic model selection based on prompt size.
    
    Args:
        prompt: The text prompt to send to the AI
        
    Returns:
        The generated response from the AI
    """
    try:
        print(f"🔄 Calling OpenAI API with prompt size: {len(prompt)}")
        
        headers = {
            "Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}",
            "Content-Type": "application/json"
        }
        
        # Estimate token count (rough approximation)
        estimated_tokens = len(prompt.split())
        print(f"Estimated token count: {estimated_tokens}")
        
        # Check if we should use a different model based on size
        if estimated_tokens > 3000:
            print("⚠️ Large prompt detected, using newer model with larger context window")
            model = "gpt-3.5-turbo"  # Use the chat model which has a larger context window
            
            # For chat models, we need to structure the request differently
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": "You are a financial analyst who specializes in analyzing Excel financial models and mapping them to standardized formats."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 1024,
                "temperature": 0.2
            }
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code != 200:
                    print(f"⚠️ OpenAI API Error Response: {response.text}")
                    raise Exception(f"OpenAI API error: {response.status_code} - {response.text}")
                    
                result = response.json()
                generated_text = result["choices"][0]["message"]["content"].strip()
        else:
            # Use the cheaper instruct model for smaller prompts
            model = "gpt-3.5-turbo-instruct"
            
            payload = {
                "model": model,
                "prompt": prompt,
                "max_tokens": 1024,
                "temperature": 0.2,
                "top_p": 0.9
            }
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/completions",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code != 200:
                    print(f"⚠️ OpenAI API Error Response: {response.text}")
                    raise Exception(f"OpenAI API error: {response.status_code} - {response.text}")
                    
                result = response.json()
                generated_text = result["choices"][0]["text"].strip()
        
        print(f"✅ OpenAI response received successfully from {model}")
        return generated_text
            
    except Exception as e:
        print(f"🔥 Error calling OpenAI API: {str(e)}")
        print("⚠️ Using fallback mapping instead")
        return create_fallback_mapping(prompt)
    
def create_fallback_mapping(prompt: str) -> str:
    """
    Create a basic mapping when AI is unavailable.
    Returns a simplified version of our enhanced JSON structure.
    
    Args:
        prompt: The original prompt that would have been sent to the AI
        
    Returns:
        JSON string containing a basic mapping
    """
    try:
        # Extract sheet info from prompt if possible
        sheet_name = "Unknown Sheet"
        sheet_type = "unknown"
        
        for line in prompt.split("\n"):
            if "Sheet name:" in line:
                sheet_name = line.split("Sheet name:")[1].strip()
            if "Sheet type:" in line:
                for type_key in SHEET_TYPE_PATTERNS:
                    patterns = SHEET_TYPE_PATTERNS[type_key]
                    if any(pattern in sheet_name.lower() for pattern in patterns):
                        sheet_type = type_key
                        break
        
        # Extract headers from prompt
        headers = []
        for line in prompt.split("\n"):
            if line.startswith("- "):
                header_part = line[2:].split(":")[0].strip()
                if header_part:
                    headers.append(header_part)
        
        # Check if this is an initial upload prompt or update prompt
        is_initial_upload = "initial upload" in prompt.lower() or "template" in prompt.lower()
        
        if is_initial_upload:
            # Basic mapping structure for template analysis
            result = {
                "workbook_properties": {
                    "sheet_count": 1,
                    "model_type": "financial_model"
                },
                "sheets": {
                    sheet_name: {
                        "sheet_properties": {
                            "type": sheet_type,
                            "index": 0
                        },
                        "key_metrics": {}
                    }
                }
            }
            
            # Only proceed if we identified the sheet type
            if sheet_type in STANDARD_METRICS:
                standard_metrics = STANDARD_METRICS[sheet_type]
                
                # Try to match headers to standard metrics
                for standard_metric in standard_metrics:
                    metric_lower = standard_metric.lower()
                    alternatives = [a.lower() for a in METRIC_ALTERNATIVES.get(standard_metric, [])]
                    
                    for header in headers:
                        header_lower = header.lower()
                        
                        if (metric_lower in header_lower or 
                            any(alt in header_lower for alt in alternatives)):
                            
                            result["sheets"][sheet_name]["key_metrics"][standard_metric] = {
                                "source_column": header,
                                "formulas": {},
                                "found_in_cells": []
                            }
                            break
        else:
            # Update file mapping structure
            result = {
                "file_type": "unknown",
                "sheets": {
                    sheet_name: {
                        "metrics": {}
                    }
                }
            }
            
            # Try to extract metrics from the headers
            if sheet_type in STANDARD_METRICS:
                standard_metrics = STANDARD_METRICS[sheet_type]
                
                for standard_metric in standard_metrics:
                    metric_lower = standard_metric.lower()
                    alternatives = [a.lower() for a in METRIC_ALTERNATIVES.get(standard_metric, [])]
                    
                    for header in headers:
                        header_lower = header.lower()
                        
                        if (metric_lower in header_lower or 
                            any(alt in header_lower for alt in alternatives)):
                            
                            result["sheets"][sheet_name]["metrics"][standard_metric] = {
                                "source_column": header,
                                "sample_value": None  # Would need actual values
                            }
                            break
        
        return json.dumps(result)
    except Exception as e:
        print(f"Error in fallback mapping: {str(e)}")
        return json.dumps({"error": "Fallback mapping failed"})

def build_enhanced_mapping_prompt(workbook_data: Dict[str, Any], is_initial_upload: bool) -> str:
    """
    Build an advanced prompt for OpenAI to help map the financial model structure.
    Limits the prompt size to avoid token limit issues.
    
    Args:
        workbook_data: The extracted workbook structure information
        is_initial_upload: Whether this is an initial template upload or an update
        
    Returns:
        Prompt string for the AI
    """
    # Count total sheets
    total_sheets = len(workbook_data["sheets"])
    
    # Determine how many sheets we can analyze based on token limitations
    max_sheets_to_analyze = 3 if total_sheets > 3 else total_sheets
    
    # Determine which sheets to analyze based on priority
    sheet_priority = prioritize_sheets(workbook_data)
    
    # Limit to max_sheets_to_analyze
    if len(sheet_priority) > max_sheets_to_analyze:
        print(f"⚠️ Limiting analysis to {max_sheets_to_analyze} priority sheets out of {total_sheets} total sheets")
        sheet_priority = sheet_priority[:max_sheets_to_analyze]
    
    # Generate sheet information sections
    sheets_info = []
    for sheet_name in sheet_priority:
        sheet_info = generate_sheet_info(workbook_data, sheet_name)
        sheets_info.append(sheet_info)
    
    # Different prompt based on whether this is an initial upload or update
    if is_initial_upload:
        # For initial uploads, we want a comprehensive analysis of the structure
        prompt = f"""
You are a financial analyst. Analyze this financial model Excel structure:

Excel workbook data ({len(sheet_priority)} of {total_sheets} sheets analyzed):

{"="*30}
{"\n\n".join(sheets_info)}
{"="*30}

This is an INITIAL UPLOAD that will serve as a TEMPLATE for future updates.
Provide a comprehensive mapping of financial metrics and their locations.

Return ONLY a JSON object with this structure:
{{
  "workbook_properties": {{
    "sheet_count": {total_sheets},
    "model_type": "<type of financial model>"
  }},
  "sheets": {{
    "<sheet_name>": {{
      "sheet_properties": {{
        "type": "<income_statement|balance_sheet|cash_flow|etc>",
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
- Balance Sheet: Assets, Liabilities, Equity
- Cash Flow: Operating CF, Investing CF, Financing CF

ONLY return the JSON object.
"""
    else:
        # For updates, we focus on mapping the data to the template
        prompt = f"""
You are a financial analyst. Analyze this financial data file:

Financial data ({len(sheet_priority)} of {total_sheets} sheets analyzed):

{"="*30}
{"\n\n".join(sheets_info)}
{"="*30}

This is an UPDATE FILE containing new financial data that needs to be mapped to a template.
Focus on identifying the financial metrics and their values.

Return ONLY a JSON object with this structure:
{{
  "file_type": "{workbook_data["workbook_properties"].get("file_type", "excel")}",
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
- Assets, Liabilities, Equity
- Operating CF, Investing CF, Financing CF

ONLY return the JSON object.
"""
    
    return prompt.strip()

def prioritize_sheets(workbook_data: Dict[str, Any]) -> List[str]:
    """
    Prioritize sheets for analysis based on their likely importance.
    
    Args:
        workbook_data: The extracted workbook structure information
        
    Returns:
        List of sheet names in priority order
    """
    # First, categorize sheets by likely importance
    high_priority_sheets = []
    medium_priority_sheets = []
    low_priority_sheets = []
    
    for sheet_name, sheet_data in workbook_data["sheets"].items():
        sheet_type = sheet_data["sheet_properties"]["type"]
        
        # Financial statements get high priority
        if sheet_type in ["income_statement", "balance_sheet", "cash_flow"]:
            high_priority_sheets.append(sheet_name)
        # Assumptions and details get medium priority
        elif sheet_type in ["assumptions", "detail", "projection"]:
            medium_priority_sheets.append(sheet_name)
        # Everything else is low priority
        else:
            low_priority_sheets.append(sheet_name)
    
    # Build the prioritized sheet list
    return high_priority_sheets + medium_priority_sheets + low_priority_sheets

def generate_sheet_info(workbook_data: Dict[str, Any], sheet_name: str) -> str:
    """
    Generate information about a specific sheet for the AI prompt.
    
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
        f"Sheet index: {sheet_data['sheet_properties']['index']}",
        f"Sheet dimensions: {sheet_data['sheet_properties'].get('dimensions', 'Unknown')}"
    ]
    
    # Add headers information (limit to first 10 headers)
    if "headers" in sheet_data and sheet_data["headers"]:
        sheet_info.append("\nColumn headers:")
        for i, header in enumerate(sheet_data["headers"][:10]):
            if header:  # Only include non-empty headers
                sheet_info.append(f"- {header}")
        if len(sheet_data["headers"]) > 10:
            sheet_info.append(f"- ... and {len(sheet_data['headers']) - 10} more headers")
    
    # Add sample values if available (limit to first 5 values)
    if "sample_values" in sheet_data and sheet_data["sample_values"]:
        sheet_info.append("\nSample values (row 2):")
        for i, (header, value) in enumerate(zip(
            sheet_data["headers"][:5], 
            sheet_data["sample_values"][:5]
        )):
            if header and value is not None:  # Only include non-empty values
                sheet_info.append(f"- {header}: {value}")
    
    # Add formula information (limit to 3 formulas)
    if "formulas" in sheet_data and sheet_data["formulas"]:
        formula_items = list(sheet_data["formulas"].items())[:3]
        if formula_items:
            sheet_info.append("\nKey formulas:")
            for cell_ref, formula in formula_items:
                sheet_info.append(f"- Cell {cell_ref}: {formula}")
    
    # Add key cells information if available
    if "key_cells" in sheet_data and sheet_data["key_cells"]:
        key_cells_items = list(sheet_data["key_cells"].items())[:5]
        if key_cells_items:
            sheet_info.append("\nKey financial metric cells:")
            for cell_ref, cell_info in key_cells_items:
                metric = cell_info.get("metric", "Unknown")
                value = cell_info.get("cell_value", "N/A")
                sheet_info.append(f"- Cell {cell_ref}: {metric} = {value}")
    
    return "\n".join(sheet_info)