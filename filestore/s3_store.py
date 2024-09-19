"""Store files in S3."""

# TODO: replace prints with logging

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
    

def hash_file(filepath: str):
   """Returns the SHA-1 hash of the file passed into it"""

   # make a hash object
   h = hashlib.sha1()

   # open file for reading in binary mode
   with open(filepath,'rb') as file:

       # loop till the end of the file
       chunk = 0
       while chunk != b'':
           # read only 1024 bytes at a time
           chunk = file.read(1024)
           h.update(chunk)

   # return the hex representation of digest
   return h.hexdigest()


class UserDocumentStore:
    """
    Store documents for users.
    The caller would know the store ID (depends on user/company, for example.)

    Stores a file using its hash code to avoid duplicate documents.
    Returns the file using its S3 path (stored in Weaviate or elsewhere).
    """

    def __init__(self, user_store_id: str):
        self.store_id = user_store_id

    def _obj_key(self, doc_hash: str) -> str:
        return f'{self.store_id}/{doc_hash}'

    def store_document(self, doc_path: str) -> str:
        """Uploads the document, returns its URL."""
        doc_hash = hash_file(doc_path)
        return upload_object(doc_path, self._obj_key(doc_hash))

    def delete_document(self, doc_url: str):
        assert doc_url.startswith('s3://')
        location = doc_url[5:]
        arr = location.split('/')
        bucket = arr[0]
        path = '/'.join(arr[1:])
        return delete_object(path, bucket)
