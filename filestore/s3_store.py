"""Store files in S3."""

import boto3
import os
from dotenv import load_dotenv

load_dotenv()

# Storage for all the docs
S3_DEFAULT_BUCKET="omega-intel-doc-storage"
AWS_DEFAULT_REGION='us-west-2'

# default client, don't tweak, for now.
s3_client = boto3.client(
    service_name='s3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name = AWS_DEFAULT_REGION,
)


# This can be used to reconstruct the bucket in a new region, etc.
def create_bucket(bucket_name=S3_DEFAULT_BUCKET):
    """Creates an S3 bucket."""

    try:
        s3_client.create_bucket(Bucket=bucket_name)
        print(f"Bucket '{bucket_name}' created successfully.")
    except Exception as e:
        print(f"Error creating bucket: {e}")


def upload_object(file_path: str, object_key: str, bucket_name=S3_DEFAULT_BUCKET):
    """Uploads an object to an S3 bucket."""

    try:
        s3_client.upload_file(file_path, bucket_name, object_key)
        print(f"File '{file_path}' uploaded to '{bucket_name}/{object_key}' successfully.")
    except Exception as e:
        print(f"Error uploading object: {e}")
