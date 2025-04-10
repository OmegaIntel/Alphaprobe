import os
import traceback
import boto3
import pandas as pd
import io, os, tempfile, json
from pathlib import Path
from typing import List, Dict, Any, Optional
from llama_index.core.schema import Document
from llama_index.core.node_parser import JSONNodeParser
from llama_index.core import VectorStoreIndex, StorageContext, load_index_from_storage
from llama_index.embeddings.openai import OpenAIEmbedding
import openai

# File bucket – where all files are stored (should match the BUCKET_NAME used in your API endpoint)
FILE_BUCKET = os.getenv("BUCKET_NAME", "deep-research-docs")

# Index bucket – where the Excel index is stored
INDEX_BUCKET = os.getenv("EXCEL_BUCKET_NAME", "excel-file-indexes")

# Create an S3 client for Excel utils operations (you can also share the client if you wish).
s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "us-east-1")
)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY


# =============================================================================
# EXCEL FILE HANDLING WITH LLAMA INDEX
# =============================================================================
def list_s3_excel_files(user_id: str, project_id: str, bucket: str = FILE_BUCKET) -> List[Dict[str, Any]]:
    prefix = f"{user_id}/{project_id}/"
    resp = s3_client.list_objects_v2(Bucket=bucket, Prefix=prefix, Delimiter="/")
    excel_files = []
    for content in resp.get("Contents", []):
        key = content["Key"]
        if key.lower().endswith((".xls", ".xlsx")):
            head = s3_client.head_object(Bucket=bucket, Key=key)
            metadata = head.get("Metadata", {})
            excel_files.append({
                "file_name": os.path.basename(key),
                "file_path": key,
                "user_id": metadata.get("user_id", ""),
                "project_id": metadata.get("project_id", "")
            })
    return excel_files

def has_excel_files(user_id: str, project_id: str) -> bool:
    files = list_s3_excel_files(user_id, project_id)
    return len(files) > 0

def get_s3_index_path(user_id: str, project_id: str) -> str:
    """Generate S3 path for storing indexes."""
    return f"indexes/{user_id}/{project_id}/excel_index/"

def download_index_from_s3(local_path: str, user_id: str, project_id: str, bucket: str = INDEX_BUCKET) -> bool:
    """Download index files from S3 if they exist."""
    s3_path = get_s3_index_path(user_id, project_id)
    try:
        objects = s3_client.list_objects_v2(Bucket=bucket, Prefix=s3_path)
        if not objects.get('Contents'):
            return False
            
        for obj in objects['Contents']:
            local_file = os.path.join(local_path, os.path.relpath(obj['Key'], s3_path))
            os.makedirs(os.path.dirname(local_file), exist_ok=True)
            s3_client.download_file(bucket, obj['Key'], local_file)
            print("[DEBUG] ")
        return True
    except Exception as e:
        print(f"[DEBUG] Index download failed: {str(e)}")
        return False

def upload_index_to_s3(local_path: str, user_id: str, project_id: str, bucket: str = INDEX_BUCKET):
    """Upload entire index directory to S3."""
    s3_path = get_s3_index_path(user_id, project_id)
    for root, _, files in os.walk(local_path):
        for file in files:
            local_file = os.path.join(root, file)
            s3_key = os.path.join(s3_path, os.path.relpath(local_file, local_path))
            s3_client.upload_file(local_file, bucket, s3_key)

def parse_excel_file(file_bytes: bytes, file_name: str) -> List[Document]:
    """Parse Excel files into structured documents with metadata."""
    documents = []
    
    try:
        # Read all sheets from the Excel file.
        xls = pd.read_excel(io.BytesIO(file_bytes), sheet_name=None)
        
        for sheet_name, df in xls.items():
            # Clean dataframe: drop rows that are completely empty and reset index.
            df = df.dropna(how='all').reset_index(drop=True)
            
            # Detect headers: assume the first row is a header if any cell is a string.
            if len(df) > 0 and df.iloc[0].apply(lambda x: isinstance(x, str)).any():
                # Convert the header row into a list immediately.
                headers = df.iloc[0].astype(str).tolist()
                # Remove the header row from the dataframe.
                df = df[1:].reset_index(drop=True)
            else:
                # If no header is found, create default column names.
                headers = [f"Column_{i+1}" for i in range(len(df.columns))]
            
            # Convert each row to a dictionary with header as keys.
            for idx, row in df.iterrows():
                row_data = {
                    str(headers[i]): str(val)
                    for i, val in enumerate(row.values)
                }
                
                doc = Document(
                    text=json.dumps(row_data),
                    metadata={
                        "file_name": file_name,
                        "sheet": sheet_name,
                        "row": idx + 2,  # Adjust to account for header row.
                        "headers": headers,
                        "data_types": [type(v).__name__ for v in row.values]
                    },
                    excluded_embed_metadata_keys=["file_name", "sheet"],
                    excluded_llm_metadata_keys=["data_types"]
                )
                documents.append(doc)
                
    except Exception as e:
        print(f"[ERROR] Failed to parse {file_name}: {str(e)}")
    
    return documents

def build_or_load_excel_index(user_id: str, project_id: str) -> Optional[VectorStoreIndex]:
    excel_files = list_s3_excel_files(user_id, project_id, bucket=FILE_BUCKET)
    if not excel_files:
        return None

    with tempfile.TemporaryDirectory() as temp_dir:
        persist_dir = Path(temp_dir) / "excel_index"
        storage_context = StorageContext.from_defaults()
        
        # Try loading the index from the index bucket.
        if download_index_from_s3(str(persist_dir), user_id, project_id, bucket=INDEX_BUCKET):
            try:
                index = load_index_from_storage(storage_context, persist_dir=str(persist_dir))
                print("[DEBUG] Loaded existing Excel index from S3")
                return index
            except Exception as e:
                print(f"[DEBUG] Failed to load S3 index: {str(e)}")

        # Build a new index if not found.
        print("[DEBUG] Building new Excel index")
        all_docs = []
        for file_info in excel_files:
            try:
                obj = s3_client.get_object(Bucket=FILE_BUCKET, Key=file_info["file_path"])
                file_bytes = obj["Body"].read()
                docs = parse_excel_file(file_bytes, file_info["file_name"])
                all_docs.extend(docs)
            except Exception as e:
                print(f"[ERROR] Failed to process {file_info['file_name']}: {str(e)}")

        if not all_docs:
            return None

        node_parser = JSONNodeParser()
        nodes = node_parser.get_nodes_from_documents(all_docs)
        embedding_model = OpenAIEmbedding(model="text-embedding-3-small")
        index = VectorStoreIndex(
            nodes=nodes,
            storage_context=storage_context,
            embed_model=embedding_model
        )
        
        # Persist index locally.
        index.storage_context.persist(persist_dir=str(persist_dir))
        
        # Upload the index to the INDEX_BUCKET.
        try:
            upload_index_to_s3(str(persist_dir), user_id, project_id, bucket=INDEX_BUCKET)
            print("[DEBUG] Uploaded new Excel index to S3")
        except Exception as e:
            print(f"[ERROR] Failed to upload index to S3: {str(e)}")

        return index

def extract_excel_index(user_id: str, project_id: str) -> Optional[VectorStoreIndex]:
    """
    Downloads an existing Excel index from the index bucket into a temporary directory
    and returns the loaded VectorStoreIndex object. Returns None if no index is found.
    """
    with tempfile.TemporaryDirectory() as temp_dir:
        persist_dir = Path(temp_dir) / "excel_index"
        os.makedirs(persist_dir, exist_ok=True)
        
        if download_index_from_s3(str(persist_dir), user_id, project_id, bucket=INDEX_BUCKET):
            try:
                # Load the storage context from the persisted directory
                storage_context = StorageContext.from_defaults(persist_dir=str(persist_dir))
                
                # Now load the index using the storage context
                index = load_index_from_storage(storage_context)
                print(f"[DEBUG] Successfully loaded Excel index with {len(index.docstore.docs)} documents")
                return index
            except Exception as e:
                print(f"[ERROR] Failed to load Excel index: {str(e)}")
                traceback.print_exc()  # Add this for detailed error logging
                return None
        else:
            print("[DEBUG] No Excel index found in S3")
            return None
