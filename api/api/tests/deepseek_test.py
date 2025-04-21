import os
import boto3
from botocore.exceptions import ClientError, NoCredentialsError, EndpointConnectionError
from dotenv import load_dotenv, find_dotenv

env_path = find_dotenv()              # walks up until it finds .env
loaded  = load_dotenv(env_path)
# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION (hard‑coded)
# ─────────────────────────────────────────────────────────────────────────────
BUCKET_NAME = "deep-research-docs"
PREFIX      = ""               # e.g. "some/path/" or "" for the whole bucket
REGION      = os.getenv("AWS_REGION")
# ─────────────────────────────────────────────────────────────────────────────

def make_s3_client():
    aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    print("Using OpenRouter API key:", openrouter_key)
    print("Using AWS region:", REGION)
    print("Using AWS_ACCESS_KEY_ID:", aws_access_key)

    if aws_access_key and aws_secret_key:
        print("Using explicit AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY from env")
        return boto3.client(
            "s3",
            aws_access_key_id     = aws_access_key,
            aws_secret_access_key = aws_secret_key,
            region_name           = REGION,
        )
    else:
        print("No explicit keys found — falling back to default credential chain")
        return boto3.client("s3", region_name=REGION)

def list_bucket(bucket_name, prefix=""):
    client = make_s3_client()
    paginator = client.get_paginator("list_objects_v2")
    try:
        page_iter = paginator.paginate(Bucket=bucket_name, Prefix=prefix)
        print(f"Objects in bucket `{bucket_name}` (prefix='{prefix}'):")
        found = False
        for page in page_iter:
            for obj in page.get("Contents", []):
                print(" -", obj["Key"])
                found = True
        if not found:
            print("  (no objects found)")
    except NoCredentialsError:
        print("ERROR: No AWS credentials found.")
    except ClientError as e:
        print("ERROR: Client error:", e)
    except EndpointConnectionError as e:
        print("ERROR: Could not connect to endpoint:", e)
    except Exception as e:
        print("ERROR:", e)

def main():
    # simply list with our hardcoded values
    list_bucket(BUCKET_NAME, PREFIX)

if __name__ == "__main__":
    main()
