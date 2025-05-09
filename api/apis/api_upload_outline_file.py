import os
from fastapi.responses import JSONResponse
from apis.api_get_current_user import get_current_user
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from utils.aws_utils import AwsUtlis
from dotenv import load_dotenv, find_dotenv

OUTLINE_BUCKET_NAME = os.getenv("OUTLINE_BUCKET_NAME", "outline-helper")

s3_client = AwsUtlis.get_s3_client()

env_path = find_dotenv()  # walks up until it finds .env
loaded = load_dotenv(env_path)


upload_outline_file_router = APIRouter()


@upload_outline_file_router.post("/api/upload-outline-file")
async def upload_files(
    files: UploadFile = File(...),
    temp_project_id: str = Form(...),
    current_user=Depends(get_current_user),
):
    user_id = current_user.id
    key = f"{user_id}/{temp_project_id}/{files.filename}"

    try:
        # Upload the file to S3
        s3_client.upload_fileobj(
            files.file,
            OUTLINE_BUCKET_NAME,
            key,
            ExtraArgs={
                "Metadata": {
                    "user_id": str(user_id),
                    "project_id": str(temp_project_id),
                }
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload to S3 failed: {str(e)}")

    return JSONResponse(
        content={
            "message": "File uploaded successfully",
            "file_name": files.filename,
            "file_path": key,
            "bucket": OUTLINE_BUCKET_NAME,
        },
        status_code=200,
    )
