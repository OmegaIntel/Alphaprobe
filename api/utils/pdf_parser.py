import tempfile  # For handling PDF downloads
from typing import List, Dict
import os
from llama_parse import LlamaParse  # For PDF parsing
import boto3

BUCKET_NAME = os.getenv("OUTLINE_BUCKET_NAME", "outline-helper")
LLAMA_CLOUD_API_KEY = os.getenv("LLAMA_CLOUD_API_KEY")

s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "us-east-1")
)

async def extract_pdf_from_s3(user_id: str, project_id: str) -> str:
    """
    Download and extract text from one or more PDF files in S3 for the given user and project.
    
    This function lists all objects under the prefix `user_id/project_id/` and picks those
    whose keys end with ".pdf" (case-insensitive). It then downloads each file, uses the PDF parser 
    (e.g. LlamaParse) to extract text, and concatenates the results.
    
    Returns:
        A single string with all extracted texts. If no PDF is found or an error occurs, returns an empty string.
    """
    prefix = f"{user_id}/{project_id}/"
    extracted_texts: List[str] = []
    
    try:
        response = s3_client.list_objects_v2(Bucket=BUCKET_NAME, Prefix=prefix)
        contents = response.get("Contents", [])
        # Filter keys that end with .pdf (case insensitive)
        pdf_keys = [obj["Key"] for obj in contents if obj["Key"].lower().endswith(".pdf")]
        
        if not pdf_keys:
            print(f"[DEBUG] No PDF files found in prefix {prefix}")
            return ""
        
        for key in pdf_keys:
            print(f"[DEBUG] Processing PDF file: {key}")
            with tempfile.NamedTemporaryFile(suffix=".pdf") as tmp:
                s3_client.download_file(BUCKET_NAME, key, tmp.name)
                # Use your PDF parser (assuming LlamaParse is imported properly)
                parser = LlamaParse(api_key=LLAMA_CLOUD_API_KEY, result_type="markdown")
                documents = parser.load_data(tmp.name)
                file_text = "\n".join(doc.text for doc in documents)
                extracted_texts.append(file_text)
        
        return "\n".join(extracted_texts)
    
    except Exception as e:
        print(f"[ERROR] PDF extraction failed: {e}")
        return ""

def parse_pdf_structure(text: str) -> List[Dict[str, str]]:
    """Extract sections from PDF text"""
    sections = []
    current_section = None
    
    for line in text.split('\n'):
        if line.startswith('# '):  # Main heading
            if current_section:
                sections.append(current_section)
            current_section = {'title': line[2:], 'content': []}
        elif line.startswith('## '):  # Subheading
            if current_section:
                sections.append(current_section)
            current_section = {'title': line[3:], 'content': []}
        elif current_section:
            current_section['content'].append(line)
    
    if current_section:
        sections.append(current_section)
    
    # Clean content
    for sec in sections:
        sec['content'] = '\n'.join(sec['content']).strip()
    
    return sections
