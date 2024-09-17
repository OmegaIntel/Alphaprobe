"""Store files in S3."""

import boto3
import os
import hashlib
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


def upload_object(file_path: str, object_key: str, bucket_name=S3_DEFAULT_BUCKET) -> str:
    """Uploads an object to an S3 bucket."""

    try:
        s3_client.upload_file(file_path, bucket_name, object_key)
        return f's3://{bucket_name}/{object_key}'
    except Exception as e:
        print(f"Error uploading object: {e}")
        return ''


def delete_object(object_key: str, bucket_name=S3_DEFAULT_BUCKET) -> str:
    """Uploads an object to an S3 bucket."""

    try:
        s3_client.delete_object(Bucket=bucket_name, Key=object_key)
        return f's3://{bucket_name}/{object_key}'
    except Exception as e:
        print(f"Error deleting object: {e}")
        return ''


class UserDocumentStore:
    """Store versioned documents for users."""

    def __init__(self, email: str):
        self.email = email

    @staticmethod
    def _hs(s: str) -> str:
        return hashlib.md5(s.encode()).hexdigest()
    
    def _obj_key(self, doc_name: str, doc_version: str) -> str:
        return f'{self._hs(self.email)}/{self._hs(doc_name)}/{self._hs(doc_version)}'

    def store_document(self, doc_path: str, doc_name: str, doc_version: str) -> str:
        """Uploads the document, returns its URL."""
        return upload_object(doc_path, self._obj_key(doc_name, doc_version))

    def delete_document(self, doc_name: str, doc_version: str):
        # TODO: delete all under doc_name
        return delete_object(self._obj_key(doc_name, doc_version))
