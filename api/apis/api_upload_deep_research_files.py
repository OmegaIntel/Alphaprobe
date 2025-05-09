import os
import uuid
import time
import json
from typing import List
from fastapi.responses import JSONResponse
from apis.api_get_current_user import get_current_user
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
import botocore
from utils.aws_utils import AwsUtlis
from utils.excel_utils import build_or_load_excel_index
from dotenv import load_dotenv, find_dotenv

env_path = find_dotenv()  # walks up until it finds .env
loaded = load_dotenv(env_path)

deer_research_upload_files_router = APIRouter()

KNOWLEDGE_BASE_ID = os.getenv("KNOWLEDGE_BASE_ID")
DATA_SOURCE_ID = os.getenv("DATA_SOURCE_ID")
BUCKET_NAME = os.getenv("BUCKET_NAME", "deep-research-docs")

bedrock_client = AwsUtlis.get_bedrock_agent()
s3_client = AwsUtlis.get_s3_client()


@deer_research_upload_files_router.post("/api/upload-deep-research")
async def upload_files(
    files: List[UploadFile] = File(...),
    temp_project_id: str = Form(...),
    current_user=Depends(get_current_user),
):
    user_id = current_user.id
    results = []

    # Upload every file into the same file bucket (BUCKET_NAME)
    for file in files:
        key = f"{user_id}/{temp_project_id}/{file.filename}"
        try:
            s3_client.upload_fileobj(
                file.file,
                BUCKET_NAME,
                key,
                ExtraArgs={
                    "Metadata": {
                        "user_id": str(user_id),
                        "project_id": str(temp_project_id),
                    }
                },
            )

            # Optionally, upload additional metadata as a separate JSON object.
            metadata_dict = {
                "metadataAttributes": {
                    "user_id": str(user_id),
                    "project_id": str(temp_project_id),
                }
            }
            metadata_content = json.dumps(metadata_dict)
            metadata_key = f"{key}.metadata.json"
            s3_client.put_object(
                Bucket=BUCKET_NAME,
                Key=metadata_key,
                Body=metadata_content,
                ContentType="application/json",
            )
        except botocore.exceptions.ClientError as e:
            raise HTTPException(
                status_code=500, detail=f"Upload to S3 failed for file: {file.filename}"
            )
        results.append(
            {"file_name": file.filename, "file_path": key, "bucket": BUCKET_NAME}
        )

        # Close prev ingestion jobs
        AwsUtlis.close_previous_ingestion_jobs()

        # Start non-Excel ingestion job with retries if needed.
        max_retries = 3
        for attempt in range(1, max_retries + 1):
            try:
                bedrock_client.start_ingestion_job(
                    knowledgeBaseId=KNOWLEDGE_BASE_ID,
                    dataSourceId=DATA_SOURCE_ID,
                    clientToken=str(uuid.uuid4()),
                    description="starting ingestion",
                )
                break  # Exit retry loop if successful.
            except botocore.exceptions.ClientError as e:
                print(f"Ingestion job attempt {attempt} failed for key: {key}")
                print("Error details:", e.response)
                if attempt == max_retries:
                    print(
                        f"Max retries reached for key: {key}. Moving on to next file."
                    )
                else:
                    time.sleep(1)

    # After all files are uploaded, check if any Excel files were submitted.
    excel_file_uploaded = any(
        file.filename.lower().endswith((".xls", ".xlsx")) for file in files
    )
    if excel_file_uploaded:
        # Call the index builder function to process Excel files from the file bucket
        # and upload the resulting index into the separate index bucket.
        index = build_or_load_excel_index(user_id, temp_project_id)
        if index is None:
            print("[DEBUG] No Excel index was created.")
        else:
            print("[DEBUG] Excel index successfully built and uploaded.")

    return JSONResponse(
        content={"message": "Files uploaded successfully", "data": results},
        status_code=200,
    )
