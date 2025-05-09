# import uuid
# import os
# import json
# from typing import Optional, List, Dict, Any
# from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
# from sqlalchemy.orm import Session
# from sqlalchemy import func
# from datetime import datetime
# import boto3
# from openpyxl import load_workbook
# from tempfile import NamedTemporaryFile
# from io import BytesIO
# import httpx

# from db_models.financial_model import FinancialModel
# from db.db_session import get_db
# from apis.api_get_current_user import get_current_user
# from db_models.users import User as UserModel

# FINANCIAL_MODEL_BUCKET = "financial-model-files"

# s3 = boto3.client(
#     "s3",
#     aws_access_key_id=os.environ["S3_ACCESS_KEY"],
#     aws_secret_access_key=os.environ["S3_SECRET_KEY"],
#     region_name=os.environ["S3_REGION"]
# )

# router = APIRouter()

# # Financial statement classification patterns
# SHEET_TYPE_PATTERNS = {
#     "income_statement": [
#         "income", "profit", "loss", "p&l", "p & l", "revenue", "earnings",
#         "operating result", "statement of operations"
#     ],
#     "balance_sheet": [
#         "balance", "financial position", "assets", "liabilities", "equity",
#         "bs "
#     ],
#     "cash_flow": [
#         "cash flow", "cashflow", "cash", "cf ", "statement of cash",
#         "sources and uses"
#     ],
#     "assumptions": [
#         "assumption", "input", "driver", "lever", "parameter", "config"
#     ],
#     "detail": [
#         "detail", "breakdown", "analysis", "deep dive", "unit", "economics",
#         "traffic", "sales detail", "user", "customer"
#     ],
#     "projection": [
#         "projection", "forecast", "budget", "plan", "target"
#     ]
# }

# # Standard financial metrics by sheet type
# STANDARD_METRICS = {
#     "income_statement": [
#         "Revenue", "Cost of Goods Sold", "Gross Profit", "Operating Expenses", 
#         "EBITDA", "Depreciation", "EBIT", "Interest Expense", 
#         "Profit Before Tax", "Tax", "Net Income"
#     ],
#     "balance_sheet": [
#         "Current Assets", "Cash", "Accounts Receivable", "Inventory", 
#         "Fixed Assets", "Total Assets", "Current Liabilities", 
#         "Accounts Payable", "Long Term Debt", "Total Liabilities", "Equity"
#     ],
#     "cash_flow": [
#         "Operating Cash Flow", "Investing Cash Flow", "Financing Cash Flow",
#         "Net Cash Flow", "Beginning Cash Balance", "Ending Cash Balance"
#     ],
# }

# # Mapping of common alternative names for key metrics
# METRIC_ALTERNATIVES = {
#     "Revenue": ["sales", "turnover", "income", "top line", "gross revenue"],
#     "EBITDA": ["operating profit", "operating income", "ebitda"],
#     "Net Income": ["net profit", "net earnings", "bottom line", "pat", "profit after tax"],
#     # Add more mappings as needed
# }

# async def call_openai(prompt: str) -> str:
#     """
#     Call OpenAI API for AI model responses.
#     Uses the gpt-3.5-turbo model, which is the most cost-effective option.
#     """
#     try:
#         print(f"🔄 Calling OpenAI API with prompt size: {len(prompt)}")
        
#         headers = {
#             "Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}",
#             "Content-Type": "application/json"
#         }
        
#         # Using gpt-3.5-turbo-instruct which is cheaper than the chat models
#         payload = {
#             "model": "gpt-3.5-turbo-instruct",
#             "prompt": prompt,
#             "max_tokens": 2048,  # Increased token limit for larger response
#             "temperature": 0.2,  # Lower temperature for more deterministic mapping
#             "top_p": 0.9
#         }
        
#         async with httpx.AsyncClient(timeout=60.0) as client:  # Increased timeout
#             response = await client.post(
#                 "https://api.openai.com/v1/completions",
#                 headers=headers,
#                 json=payload
#             )
            
#             if response.status_code != 200:
#                 print(f"⚠️ OpenAI API Error Response: {response.text}")
#                 raise Exception(f"OpenAI API error: {response.status_code} - {response.text}")
                
#             result = response.json()
#             generated_text = result["choices"][0]["text"].strip()
            
#             print(f"✅ OpenAI response received successfully")
#             return generated_text
            
#     except Exception as e:
#         print(f"🔥 Error calling OpenAI API: {str(e)}")
#         print("⚠️ Using fallback mapping instead")
#         return create_fallback_mapping(prompt)
    
# def create_fallback_mapping(prompt: str) -> str:
#     """
#     Create a basic mapping when AI is unavailable.
#     Returns a simplified version of our enhanced JSON structure.
#     """
#     try:
#         # Extract sheet info from prompt if possible
#         sheet_name = "Unknown Sheet"
#         sheet_type = "unknown"
        
#         for line in prompt.split("\n"):
#             if "Sheet name:" in line:
#                 sheet_name = line.split("Sheet name:")[1].strip()
#             if "Sheet type:" in line:
#                 for type_key in SHEET_TYPE_PATTERNS:
#                     patterns = SHEET_TYPE_PATTERNS[type_key]
#                     if any(pattern in sheet_name.lower() for pattern in patterns):
#                         sheet_type = type_key
#                         break
        
#         # Extract headers from prompt
#         headers = []
#         for line in prompt.split("\n"):
#             if line.startswith("- "):
#                 header_part = line[2:].split(":")[0].strip()
#                 if header_part:
#                     headers.append(header_part)
        
#         # Basic mapping structure
#         result = {
#             "workbook_properties": {
#                 "sheet_count": 1
#             },
#             "sheets": {
#                 sheet_name: {
#                     "sheet_properties": {
#                         "type": sheet_type,
#                         "index": 0
#                     },
#                     "key_metrics": {}
#                 }
#             }
#         }
        
#         # Only proceed if we identified the sheet type
#         if sheet_type in STANDARD_METRICS:
#             standard_metrics = STANDARD_METRICS[sheet_type]
            
#             # Try to match headers to standard metrics
#             for standard_metric in standard_metrics:
#                 metric_lower = standard_metric.lower()
#                 alternatives = [a.lower() for a in METRIC_ALTERNATIVES.get(standard_metric, [])]
                
#                 for header in headers:
#                     header_lower = header.lower()
                    
#                     if (metric_lower in header_lower or 
#                         any(alt in header_lower for alt in alternatives)):
                        
#                         result["sheets"][sheet_name]["key_metrics"][standard_metric] = {
#                             "source_column": header,
#                             "formulas": {},
#                             "found_in_cells": []
#                         }
#                         break
        
#         return json.dumps(result)
#     except Exception as e:
#         print(f"Error in fallback mapping: {str(e)}")
#         return json.dumps({"error": "Fallback mapping failed"})

# def classify_sheet_type(sheet_name: str, headers: List[str]) -> str:
#     """
#     Determine the type of financial sheet based on name and headers.
#     """
#     sheet_name_lower = sheet_name.lower()
    
#     # First check sheet name against patterns
#     for sheet_type, patterns in SHEET_TYPE_PATTERNS.items():
#         if any(pattern in sheet_name_lower for pattern in patterns):
#             return sheet_type
    
#     # If not found by name, check headers
#     headers_text = " ".join(str(h).lower() for h in headers if h)
#     for sheet_type, patterns in SHEET_TYPE_PATTERNS.items():
#         if any(pattern in headers_text for pattern in patterns):
#             return sheet_type
    
#     # Default to unknown if no match found
#     return "unknown"

# def find_cell_formula(sheet, cell_reference: str) -> Optional[str]:
#     """
#     Safely extract formula from a cell if it exists.
#     """
#     try:
#         cell = sheet[cell_reference]
#         return cell.formula if hasattr(cell, 'formula') and cell.formula else None
#     except:
#         return None

# def build_enhanced_mapping_prompt(workbook_data: Dict[str, Any]) -> str:
#     """
#     Build an advanced prompt for OpenAI to help map the financial model structure.
#     """
#     sheets_info = []
    
#     for sheet_name, sheet_data in workbook_data["sheets"].items():
#         sheet_type = sheet_data["sheet_properties"]["type"]
        
#         sheet_info = [
#             f"Sheet name: {sheet_name}",
#             f"Sheet type: {sheet_type}",
#             f"Sheet index: {sheet_data['sheet_properties']['index']}",
#             f"Sheet dimensions: {sheet_data['sheet_properties'].get('dimensions', 'Unknown')}"
#         ]
        
#         # Add headers information
#         if "headers" in sheet_data:
#             sheet_info.append("\nColumn headers:")
#             for i, header in enumerate(sheet_data["headers"]):
#                 sheet_info.append(f"- {header}")
        
#         # Add sample values if available
#         if "sample_values" in sheet_data:
#             sheet_info.append("\nSample values (row 2):")
#             for i, (header, value) in enumerate(zip(sheet_data["headers"], sheet_data["sample_values"])):
#                 if value is not None:
#                     sheet_info.append(f"- {header}: {value}")
        
#         # Add formula information
#         if "formulas" in sheet_data:
#             sheet_info.append("\nKey formulas:")
#             for cell_ref, formula in sheet_data["formulas"].items():
#                 sheet_info.append(f"- Cell {cell_ref}: {formula}")
        
#         sheets_info.append("\n".join(sheet_info))
    
#     # Build the complete prompt
#     prompt = f"""
# You are a financial analyst assistant. A user has uploaded a financial spreadsheet with multiple sheets.

# I'll provide information about each sheet, and I need you to:
# 1. Confirm or correct the sheet type classification
# 2. Map column headers to standardized financial metrics
# 3. Identify key cells and their formulas
# 4. Note any relationships between sheets

# Below is the data from the Excel workbook:

# {"="*50}
# {"\n\n".join(sheets_info)}
# {"="*50}

# Based on this information, create a comprehensive JSON object with the following structure:

# {{
#   "workbook_properties": {{
#     "sheet_count": <number>,
#     "model_type": <type of financial model>
#   }},
#   "sheets": {{
#     "<sheet_name>": {{
#       "sheet_properties": {{
#         "index": <sheet position>,
#         "type": <sheet type: income_statement, balance_sheet, cash_flow, assumptions, etc.>,
#         "time_period": <time period if applicable: annual, monthly, quarterly>,
#         "dimensions": <sheet dimensions>
#       }},
#       "key_metrics": {{
#         "<standardized_metric_name>": {{
#           "source_column": "<original column name in sheet>",
#           "formulas": {{
#             "<period or identifier>": "<formula or cell reference>"
#           }},
#           "found_in_cells": ["<cell references>"]
#         }}
#       }}
#     }}
#   }}
# }}

# For standardized metric names, use these categories based on sheet type:

# Income Statement: Revenue, Cost of Goods Sold, Gross Profit, Operating Expenses, EBITDA, Depreciation, EBIT, Interest Expense, Profit Before Tax, Tax, Net Income

# Balance Sheet: Current Assets, Cash, Accounts Receivable, Inventory, Fixed Assets, Total Assets, Current Liabilities, Accounts Payable, Long Term Debt, Total Liabilities, Equity

# Cash Flow: Operating Cash Flow, Investing Cash Flow, Financing Cash Flow, Net Cash Flow, Beginning Cash Balance, Ending Cash Balance

# Respond with ONLY the JSON object and no other text.
# """
#     return prompt.strip()

# def extract_workbook_structure(workbook) -> Dict[str, Any]:
#     """
#     Extract the structure of an Excel workbook including sheets, headers, and formulas.
#     """
#     result = {
#         "workbook_properties": {
#             "sheet_count": len(workbook.sheetnames),
#             "sheet_names": workbook.sheetnames
#         },
#         "sheets": {}
#     }
    
#     # Process each sheet in the workbook
#     for idx, sheet_name in enumerate(workbook.sheetnames):
#         try:
#             sheet = workbook[sheet_name]
            
#             # Get sheet dimensions
#             dimensions = sheet.dimensions
            
#             # Extract headers (first row)
#             headers = []
#             for cell in next(sheet.rows):
#                 headers.append(cell.value)
            
#             # Extract sample values (second row for context)
#             sample_values = []
#             second_row = list(sheet.iter_rows(min_row=2, max_row=2, values_only=True))
#             if second_row:
#                 sample_values = list(second_row[0])
            
#             # Determine sheet type based on name and headers
#             sheet_type = classify_sheet_type(sheet_name, headers)
            
#             # Extract formulas (sample from the sheet)
#             # Note: This only works if workbook was loaded with data_only=False
#             formulas = {}
#             formula_count = 0
            
#             # We'll try to get formulas, but won't fail if they're not available
#             try:
#                 max_formulas = 20  # Limit number of formulas to extract
                
#                 # Define a max range to scan for formulas
#                 max_row = min(sheet.max_row, 50)  # Limit to first 50 rows for performance
#                 max_col = min(sheet.max_column, 20)  # Limit to first 20 columns
                
#                 for row in range(1, max_row + 1):
#                     for col in range(1, max_col + 1):
#                         cell = sheet.cell(row=row, column=col)
#                         if hasattr(cell, 'formula') and cell.formula:
#                             cell_ref = cell.coordinate
#                             formulas[cell_ref] = cell.formula
#                             formula_count += 1
                            
#                             if formula_count >= max_formulas:
#                                 break
#                     if formula_count >= max_formulas:
#                         break
#             except Exception as formula_error:
#                 print(f"Note: Could not extract formulas from sheet '{sheet_name}': {str(formula_error)}")
#                 # Continue processing without formulas
            
#             # Store sheet data
#             result["sheets"][sheet_name] = {
#                 "sheet_properties": {
#                     "index": idx,
#                     "type": sheet_type,
#                     "dimensions": dimensions
#                 },
#                 "headers": headers,
#                 "sample_values": sample_values,
#                 "formulas": formulas
#             }
            
#         except Exception as e:
#             print(f"Error extracting data from sheet '{sheet_name}': {str(e)}")
#             # Include a minimal entry for this sheet
#             result["sheets"][sheet_name] = {
#                 "sheet_properties": {
#                     "index": idx,
#                     "type": "error",
#                     "error": str(e)
#                 }
#             }
    
#     return result

# @router.get("/api/financial-models/presigned-url")
# def get_presigned_url(s3_key: str, db: Session = Depends(get_db)):
#     try:
#         url = s3.generate_presigned_url(
#             'get_object',
#             Params={'Bucket': FINANCIAL_MODEL_BUCKET, 'Key': s3_key},
#             ExpiresIn=600  # 10 minutes
#         )
#         return {"url": url}
#     except Exception as e:
#         print(f"[❌] Failed to generate signed URL: {e}")
#         raise HTTPException(status_code=500, detail="Unable to generate download link")

# @router.post("/api/financial-models/upload")
# async def upload_financial_model(
#     company_name: str = Form(...),
#     is_initial_upload: bool = Form(...),
#     file: UploadFile = File(...),
#     reference_model_id: Optional[str] = Form(None),
#     note: Optional[str] = Form(None),
#     current_user: UserModel = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     try:
#         print("🔁 Starting upload process...")
#         user_id = current_user.id
#         print(f"👤 User ID: {user_id}")

#         file_ext = os.path.splitext(file.filename)[-1].lower()
#         if file_ext not in [".xlsx", ".xls"]:
#             raise HTTPException(status_code=400, detail="Only Excel files are supported")

#         file_content = file.file.read()
#         model_group_id = None
#         template_file_path = None

#         # Step 1: Load and analyze the uploaded workbook
#         print("📊 Analyzing Excel workbook structure...")
        
#         # First load with data_only=True to get calculated values
#         wb_input_values = load_workbook(BytesIO(file_content), data_only=True)
        
#         # Then try to load again with data_only=False to access formulas
#         # We'll use a try/except block in case this fails
#         try:
#             wb_input_formulas = load_workbook(BytesIO(file_content), data_only=False)
#             print("✅ Successfully loaded workbook with formulas")
            
#             # Merge formula and value information
#             wb_merged = wb_input_formulas
#             # We'll use the formula workbook but extract sample values from the value workbook
            
#             # Extract workbook structure including sheets, headers, and formulas
#             workbook_data = extract_workbook_structure(wb_merged)
            
#             # Add sample values from the data_only=True workbook
#             for sheet_name in workbook_data["sheets"]:
#                 if sheet_name in wb_input_values.sheetnames:
#                     try:
#                         data_sheet = wb_input_values[sheet_name]
#                         # Get sample values from second row
#                         sample_values = []
#                         second_row = list(data_sheet.iter_rows(min_row=2, max_row=2, values_only=True))
#                         if second_row:
#                             sample_values = list(second_row[0])
                            
#                         workbook_data["sheets"][sheet_name]["sample_values"] = sample_values
#                     except Exception as e:
#                         print(f"Warning: Could not get values from sheet '{sheet_name}': {str(e)}")
                        
#         except Exception as e:
#             print(f"⚠️ Could not load workbook with formulas: {str(e)}")
#             print("⚠️ Proceeding with calculated values only")
#             # Fall back to just using the data_only=True workbook
#             workbook_data = extract_workbook_structure(wb_input_values)
        
#         # Step 2: Generate AI-powered mapping
#         print("🧠 Generating intelligent mapping of financial data...")
#         mapping_prompt = build_enhanced_mapping_prompt(workbook_data)
        
#         try:
#             raw_mapping = await call_openai(mapping_prompt)
#             mapping_json = json.loads(raw_mapping)
#             print("✅ Successfully generated enhanced mapping")
#         except Exception as e:
#             print(f"⚠️ Error in AI mapping: {str(e)}")
#             print("⚠️ Using fallback structured mapping")
#             # Create a more basic fallback mapping based on our structure
#             mapping_json = json.loads(create_fallback_mapping(mapping_prompt))

#         if not is_initial_upload:
#             print("🔗 Processing update for existing model...")

#             if not reference_model_id:
#                 raise HTTPException(status_code=400, detail="Reference model ID required for updates")

#             try:
#                 reference_model_id = str(uuid.UUID(reference_model_id))
#             except ValueError:
#                 raise HTTPException(status_code=400, detail="Invalid reference model ID")

#             # Convert reference_model_id string to UUID before querying
#             reference_model_uuid = uuid.UUID(reference_model_id)
#             reference_model = db.query(FinancialModel).filter(
#                 FinancialModel.id == reference_model_uuid,
#                 FinancialModel.is_initial_upload == True
#             ).first()

#             if not reference_model:
#                 raise HTTPException(status_code=404, detail="Reference model not found")

#             model_group_id = reference_model.id
            
#             # Download the template file
#             with NamedTemporaryFile(delete=False, suffix=".xlsx") as temp_template:
#                 s3.download_fileobj(FINANCIAL_MODEL_BUCKET, reference_model.original_file_s3, temp_template)
#                 template_file_path = temp_template.name
            
#             # Process the update using our enhanced mapping
#             try:
#                 # Load the template workbook
#                 wb_template = load_workbook(template_file_path)
#                 template_sheet = wb_template.active
                
#                 # The field_to_cell mapping could be enhanced to use our mapping_json
#                 # This is a simplified version that still uses the original approach
#                 field_to_cell = {"Revenue": "B5", "EBITDA": "B6", "Net Income": "B7"}
                
#                 # Use the enhanced mapping to update the template
#                 updated_cells = []
                
#                 # Get the first sheet name from the mapping
#                 if not mapping_json.get("sheets"):
#                     print("⚠️ No sheet data found in mapping")
#                 else:
#                     # Process each sheet in the mapping
#                     for sheet_name, sheet_data in mapping_json.get("sheets", {}).items():
#                         if not "key_metrics" in sheet_data:
#                             continue
                            
#                         key_metrics = sheet_data.get("key_metrics", {})
#                         # Get headers from this sheet data
#                         sheet_headers = sheet_data.get("headers", [])
                        
#                         for metric_name, metric_data in key_metrics.items():
#                             if metric_name in field_to_cell:
#                                 source_column = metric_data.get("source_column")
                                
#                                 # Find this sheet in the original workbook data
#                                 if sheet_name in workbook_data.get("sheets", {}):
#                                     sheet_info = workbook_data["sheets"][sheet_name]
#                                     headers = sheet_info.get("headers", [])
#                                     sample_values = sheet_info.get("sample_values", [])
                                    
#                                     # If we have a source column and we can find it in the uploaded file
#                                     if source_column and headers and source_column in headers:
#                                         col_idx = headers.index(source_column)
                                        
#                                         # Get the value from the uploaded file
#                                         if col_idx < len(sample_values):
#                                             value = sample_values[col_idx]
                                            
#                                             # Update the template
#                                             template_sheet[field_to_cell[metric_name]] = value
#                                             updated_cells.append(f"{metric_name}: {value}")
#                                             print(f"Updated {metric_name} with value {value} from column {source_column}")
                
#                 # Save the updated template
#                 with NamedTemporaryFile(delete=False, suffix=".xlsx") as updated_file:
#                     wb_template.save(updated_file.name)
#                     updated_file.seek(0)
#                     s3_key_updated = f"updated-models/{user_id}/{datetime.utcnow().isoformat()}_{file.filename}"
#                     s3.upload_file(updated_file.name, FINANCIAL_MODEL_BUCKET, s3_key_updated)
                
#                 print(f"✅ Updated {len(updated_cells)} cells in template: {', '.join(updated_cells)}")
                
#             except Exception as e:
#                 print(f"❌ Error processing updated model: {str(e)}")
#                 raise HTTPException(status_code=500, detail=f"Processing updated model failed: {str(e)}")
#         else:
#             print("📁 Processing initial upload...")
#             s3_key_updated = None

#         # Upload the original file to S3
#         s3_key_original = f"uploads/{user_id}/{str(uuid.uuid4())}_{file.filename}"
#         s3.upload_fileobj(BytesIO(file_content), FINANCIAL_MODEL_BUCKET, s3_key_original)

#         # Create a new database record
#         new_model = FinancialModel(
#             user_id=user_id,
#             company_name=company_name,
#             original_file_s3=s3_key_original,
#             updated_model_s3=s3_key_updated,
#             is_initial_upload=is_initial_upload,
#             model_group_id=model_group_id,
#             note=note,
#             mapping_json=mapping_json
#         )
#         db.add(new_model)
#         db.commit()
#         db.refresh(new_model)

#         if is_initial_upload:
#             new_model.model_group_id = new_model.id
#             db.add(new_model)
#             db.commit()

#         return {
#             "message": "File uploaded and processed successfully",
#             "data": {
#                 "id": str(new_model.id),
#                 "company_name": new_model.company_name,
#                 "original_file_s3": new_model.original_file_s3,
#                 "updated_model_s3": new_model.updated_model_s3,
#                 "model_group_id": str(new_model.model_group_id),
#                 "is_initial_upload": new_model.is_initial_upload,
#                 "mapping_json": new_model.mapping_json
#             }
#         }

#     except Exception as e:
#         print(f"🔥 Error during upload: {str(e)}")
#         import traceback
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# @router.get("/api/financial-models/group/{model_group_id}")
# def get_models_by_group(model_group_id: str, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
#     try:
#         # Log the incoming ID for debugging
#         print(f"Received model_group_id: {model_group_id}, type: {type(model_group_id)}")
        
#         # Convert string model_group_id to UUID
#         uuid_model_group_id = uuid.UUID(model_group_id)
        
#         # Query with the converted UUID
#         models = db.query(FinancialModel).filter(
#             FinancialModel.model_group_id == uuid_model_group_id
#         ).order_by(FinancialModel.created_at.asc()).all()
        
#         return {"models": [
#             {
#                 "id": str(m.id),
#                 "company_name": m.company_name,
#                 "original_file_s3": m.original_file_s3,
#                 "updated_model_s3": m.updated_model_s3,
#                 "created_at": m.created_at.isoformat(),
#                 "is_initial_upload": m.is_initial_upload
#             } for m in models
#         ]}
#     except ValueError as e:
#         print(f"Invalid UUID format: {str(e)}")
#         raise HTTPException(status_code=400, detail="Invalid model group ID format")
#     except Exception as e:
#         print(f"Error in get_models_by_group: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Failed to retrieve models: {str(e)}")
    
# @router.get("/api/financial-models/list")
# def list_models(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
#     try:
#         # Get user ID as string
#         user_id_str = current_user.id  # This is already a string from get_current_user
#         print(f"Looking for models with user_id: {user_id_str}")
        
#         # Use string comparison with manual filter for safer results
#         all_models = db.query(FinancialModel).all()
        
#         # Filter manually (bypassing any ORM type conversion issues)
#         user_models = []
#         for model in all_models:
#             if str(model.user_id) == user_id_str and model.is_initial_upload:
#                 user_models.append({
#                     "id": str(model.id),
#                     "company_name": model.company_name,
#                     "original_file_s3": model.original_file_s3,
#                     "updated_model_s3": model.updated_model_s3,
#                     "created_at": model.created_at.isoformat(),
#                     "is_initial_upload": model.is_initial_upload,
#                     "model_group_id": str(model.model_group_id) if model.model_group_id else None
#                 })
        
#         print(f"Final response has {len(user_models)} models")
#         return {"models": user_models}
#     except Exception as e:
#         print(f"Error in list_models: {str(e)}")
#         import traceback
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=f"Failed to retrieve models list: {str(e)}")

# @router.get("/api/financial-models/{id}")
# def get_model(id: str, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
#     try:
#         # Log the incoming ID for debugging
#         print(f"Received model id: {id}, type: {type(id)}")
        
#         # Convert string id to UUID
#         model_id = uuid.UUID(id)
        
#         # Query with the converted UUID
#         model = db.query(FinancialModel).filter(FinancialModel.id == model_id).first()
        
#         if not model:
#             raise HTTPException(status_code=404, detail="Model not found")
            
#         return {
#             "id": str(model.id),
#             "company_name": model.company_name,
#             "original_file_s3": model.original_file_s3,
#             "updated_model_s3": model.updated_model_s3,
#             "is_initial_upload": model.is_initial_upload,
#             "model_group_id": str(model.model_group_id) if model.model_group_id else None,
#             "created_at": model.created_at.isoformat()
#         }
#     except ValueError as e:
#         print(f"Invalid UUID format: {str(e)}")
#         raise HTTPException(status_code=400, detail="Invalid model ID format")
#     except Exception as e:
#         print(f"Error in get_model: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Failed to retrieve model: {str(e)}")


# @router.delete("/api/financial-models/{id}")
# def delete_model(id: str, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
#     try:
#         # Log the incoming ID for debugging
#         print(f"Received model id for deletion: {id}, type: {type(id)}")
        
#         # Convert string id to UUID
#         model_id = uuid.UUID(id)
        
#         # Query with the converted UUID
#         model = db.query(FinancialModel).filter(FinancialModel.id == model_id).first()
        
#         if not model:
#             raise HTTPException(status_code=404, detail="Model not found")
            
#         db.delete(model)
#         db.commit()
#         return {"message": "Model deleted successfully"}
#     except ValueError as e:
#         print(f"Invalid UUID format: {str(e)}")
#         raise HTTPException(status_code=400, detail="Invalid model ID format")
#     except Exception as e:
#         print(f"Error in delete_model: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Failed to delete model: {str(e)}")


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
        print("🔁 Starting upload process...")
        user_id = current_user.id
        print(f"👤 User ID: {user_id}")

        # Read the file content
        file_content = file.file.read()
        file_ext = os.path.splitext(file.filename)[-1].lower()
        
        # Check file type and process accordingly
        if file_ext not in [".xlsx", ".xls", ".csv"]:
            raise HTTPException(status_code=400, detail="Only Excel (.xlsx, .xls) and CSV files are supported")

        model_group_id = None
        template_file_path = None
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
            s3_key_original = f"uploads/{user_id}/{str(uuid.uuid4())}_{file.filename}"
            s3.upload_fileobj(BytesIO(file_content), FINANCIAL_MODEL_BUCKET, s3_key_original)
            
            # For initial uploads, there's no updated model file yet
            s3_key_updated = None
            
        else:
            # This is an update to an existing model
            print("🔄 Processing update with new financial data...")
            
            if not reference_model_id:
                raise HTTPException(status_code=400, detail="Reference model ID required for updates")

            try:
                reference_model_id = str(uuid.UUID(reference_model_id))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid reference model ID")

            # Convert reference_model_id string to UUID before querying
            reference_model_uuid = uuid.UUID(reference_model_id)
            reference_model = db.query(FinancialModel).filter(
                FinancialModel.id == reference_model_uuid,
                FinancialModel.is_initial_upload == True
            ).first()

            if not reference_model:
                raise HTTPException(status_code=404, detail="Reference model not found")

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
            
            # Download the template file
            with NamedTemporaryFile(delete=False, suffix=".xlsx") as temp_template:
                s3.download_fileobj(FINANCIAL_MODEL_BUCKET, reference_model.original_file_s3, temp_template)
                template_file_path = temp_template.name
            
            # Get the reference model mapping from the database
            reference_mapping = reference_model.mapping_json
            if not reference_mapping:
                raise HTTPException(status_code=400, detail="Reference model does not have valid mapping data")
            
            # Create a cell mapping based on the reference model
            cell_mapping = find_standardized_cell_mapping(reference_mapping, update_file_mapping)
            
            if not cell_mapping:
                raise HTTPException(status_code=400, detail="Could not create valid cell mapping between template and update file")
            
            # Update the template with new data
            print("🔄 Updating template with new financial data...")
            try:
                # Update the template with new data
                success, updated_cells = update_template_with_new_data(
                    template_file_path, cell_mapping, update_file_mapping
                )
                
                if not success:
                    print("⚠️ No cells were updated in the template")
                else:
                    print(f"✅ Updated {len(updated_cells)} cells in the template")
                    for update in updated_cells[:5]:  # Print first 5 updates
                        print(f"  - {update}")
                    if len(updated_cells) > 5:
                        print(f"  - ...and {len(updated_cells) - 5} more updates")
                
                # Save the updated template to S3
                s3_key_updated = f"updated-models/{user_id}/{datetime.utcnow().isoformat()}_{file.filename}"
                s3.upload_file(template_file_path, FINANCIAL_MODEL_BUCKET, s3_key_updated)
                
            except Exception as e:
                print(f"❌ Error updating template: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error updating template: {str(e)}")
            
            # Upload the original update file to S3 as well
            s3_key_original = f"uploads/{user_id}/{str(uuid.uuid4())}_{file.filename}"
            s3.upload_fileobj(BytesIO(file_content), FINANCIAL_MODEL_BUCKET, s3_key_original)
            
            # Create mapping JSON for the record
            mapping_json = {
                "reference_model_id": str(reference_model.id),
                "update_file_mapping": update_file_mapping,
                "cell_mapping": cell_mapping,
                "updated_cells": updated_cells[:20]  # Store first 20 updated cells for reference
            }

        # Create a new database record
        new_model = FinancialModel(
            user_id=user_id,
            company_name=company_name,
            original_file_s3=s3_key_original,
            updated_model_s3=s3_key_updated,
            is_initial_upload=is_initial_upload,
            model_group_id=model_group_id,
            note=note,
            mapping_json=mapping_json
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
            "message": "File uploaded and processed successfully",
            "data": {
                "id": str(new_model.id),
                "company_name": new_model.company_name,
                "original_file_s3": new_model.original_file_s3,
                "updated_model_s3": new_model.updated_model_s3,
                "model_group_id": str(new_model.model_group_id) if new_model.model_group_id else None,
                "is_initial_upload": new_model.is_initial_upload,
                "updates_applied": len(updated_cells) if updated_cells else 0
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
        
        # Query with the converted UUID
        models = db.query(FinancialModel).filter(
            FinancialModel.model_group_id == uuid_model_group_id
        ).order_by(FinancialModel.created_at.asc()).all()
        
        return {"models": [
            {
                "id": str(m.id),
                "company_name": m.company_name,
                "original_file_s3": m.original_file_s3,
                "updated_model_s3": m.updated_model_s3,
                "created_at": m.created_at.isoformat(),
                "is_initial_upload": m.is_initial_upload,
                "note": m.note,
                "updates_applied": len(m.mapping_json.get("updated_cells", [])) if not m.is_initial_upload and isinstance(m.mapping_json, dict) else 0
            } for m in models
        ]}
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