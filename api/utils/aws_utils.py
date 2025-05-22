import os
import boto3, botocore
from botocore.config import Config

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_SESSION_TOKEN = os.getenv("AWS_SESSION_TOKEN")
KNOWLEDGE_BASE_ID = os.getenv("KNOWLEDGE_BASE_ID")
DATA_SOURCE_ID = os.getenv("DATA_SOURCE_ID")


class AwsUtils:

    @classmethod
    def get_s3_client(cls):
        """
        Returns a boto3 client for AWS s3.
        """
        cfg = Config(
            region_name="us-east-1",
            max_pool_connections=50,    # bump this up as needed
            retries={"max_attempts": 3, "mode": "standard"},
        )
        return boto3.client(
            "s3",
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION,
            config=cfg,
        )

    @classmethod
    def get_bedrock_agent(cls):
        """
        Returns a boto3 client for bedrock-agent.
        """
        cfg = Config(
            region_name="us-east-1",
            max_pool_connections=50,    # bump this up as needed
            retries={"max_attempts": 3, "mode": "standard"},
        )
        return boto3.client(
            "bedrock-agent",
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION,
            config=cfg,
        )

    @classmethod
    def get_bedrock_agent_runtime(cls):
        """
        Returns a boto3 client for bedrock-agent-runtime.
        """
        cfg = Config(
            region_name="us-east-1",
            max_pool_connections=50,    # bump this up as needed
            retries={"max_attempts": 3, "mode": "standard"},
        )
        return boto3.client(
            "bedrock-agent-runtime",
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION,
            config=cfg,
        )

    @classmethod
    def get_bedrock_runtime(cls):
        """
        Returns a boto3 client for bedrock-runtime.
        """
        cfg = Config(
            region_name="us-east-1",
            max_pool_connections=50,    # bump this up as needed
            retries={"max_attempts": 3, "mode": "standard"},
        )
        return boto3.client(
            "bedrock-runtime",
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            aws_session_token=AWS_SESSION_TOKEN,
            config=cfg,
        )

    @classmethod
    def close_previous_ingestion_jobs(cls):
        """
        List any ongoing ingestion jobs for the given knowledge base and data source,
        and stop them using the correct AWS Bedrock API methods.
        """
        try:
            print("[DEBUG] Checking for ongoing ingestion jobs...")

            bedrock_client = cls.get_bedrock_agent()
            # List ingestion jobs with pagination handling
            paginator = bedrock_client.get_paginator("list_ingestion_jobs")
            job_summaries = []

            for page in paginator.paginate(
                knowledgeBaseId=KNOWLEDGE_BASE_ID, dataSourceId=DATA_SOURCE_ID
            ):
                job_summaries.extend(page.get("ingestionJobSummaries", []))

            # Process each job
            jobs_stopped = 0
            for job in job_summaries:
                status = job.get("status", "").upper()
                ingestion_job_id = job.get("ingestionJobId")

                # Skip jobs that are already in terminal states
                if status in ["COMPLETE", "STOPPED", "FAILED"]:
                    continue

                print(
                    f"[DEBUG] Stopping ingestion job {ingestion_job_id} with status {status}"
                )
                try:
                    bedrock_client.stop_ingestion_job(
                        knowledgeBaseId=KNOWLEDGE_BASE_ID,
                        dataSourceId=DATA_SOURCE_ID,
                        ingestionJobId=ingestion_job_id,
                    )
                    jobs_stopped += 1
                except botocore.exceptions.ClientError as e:
                    error_code = e.response.get("Error", {}).get("Code")
                    if error_code == "ResourceNotFoundException":
                        print(f"[INFO] Job {ingestion_job_id} no longer exists")
                    else:
                        print(
                            f"[WARNING] Failed to stop ingestion job {ingestion_job_id}: {str(e)}"
                        )
                except Exception as e:
                    print(
                        f"[WARNING] Unexpected error stopping job {ingestion_job_id}: {str(e)}"
                    )

            print(
                f"[DEBUG] Stopped {jobs_stopped} ingestion jobs. Total jobs checked: {len(job_summaries)}"
            )

        except botocore.exceptions.ClientError as e:
            print(f"[ERROR] AWS API error checking ingestion jobs: {str(e)}")
        except Exception as e:
            print(
                f"[ERROR] Unexpected error in close_previous_ingestion_jobs: {str(e)}"
            )
