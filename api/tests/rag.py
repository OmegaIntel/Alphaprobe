import os
import json
import requests
import boto3
import tqdm
import uuid
import time
import argparse
from pathlib import Path
from datasets import Dataset
from botocore.exceptions import ClientError
from requests.exceptions import HTTPError
from ragas import evaluate
from ragas.metrics import faithfulness, answer_correctness
from openai import OpenAI
import sys
import pathlib

# ── REPO BOOTSTRAP ─────────────────────────────────────────────────────

def add_repo_root(repo_name: str = "Alphaprobe") -> None:
    here = pathlib.Path(__file__).resolve()
    for parent in [here, *here.parents]:
        if parent.name == repo_name:
            sys.path.append(str(parent))
            return
    raise RuntimeError(f"Could not locate repo root named '{repo_name}'")

# call once, before any project imports
add_repo_root()

from api.utils.aws_utils import AwsUtils
from api.utils.kb_search import retrieve_kb_contexts

# ── CONSTANTS (override via env if desired) ──────────────────────────────
KB_BUCKET       = os.getenv("KB_BUCKET", "kb-bucket-tester")
S3_PREFIX       = os.getenv("S3_PREFIX", "test-data/finqa")
KB_ID           = os.getenv("KB_ID", "YHYCE7GDL7")
DATA_SOURCE_ID  = os.getenv("DATA_SOURCE_ID", "DRPSJMJJ75")
USER_ID         = os.getenv("USER_ID", "rushil")
PROJECT_ID      = os.getenv("PROJECT_ID", "finqa-demo")
MODEL_ARN       = os.getenv("MODEL_ARN") or None
PDF_BASE        = os.getenv("PDF_BASE", "https://raw.githubusercontent.com/cunchi423/FinQA/main/dataset/pdf/")

if not MODEL_ARN:
    raise EnvironmentError("MODEL_ARN environment variable is not set")
if "OPENAI_API_KEY" not in os.environ:
    raise EnvironmentError("OPENAI_API_KEY environment variable is not set")

# ── AWS CLIENTS ─────────────────────────────────────────────────────────
s3    = boto3.client("s3")
agent = AwsUtils.get_bedrock_agent()
openai_client = OpenAI()

# ── HELPER FUNCTIONS ─────────────────────────────────────────────────────

def upload_with_metadata(pdf_path: Path):
    key_base = f"{S3_PREFIX}/{pdf_path.name}"
    meta_key = f"{key_base}.metadata.json"
    # upload PDF
    try:
        s3.head_object(Bucket=KB_BUCKET, Key=key_base)
    except ClientError:
        s3.upload_file(str(pdf_path), KB_BUCKET, key_base,
                       ExtraArgs={"Metadata": {"user_id": USER_ID, "project_id": PROJECT_ID}})
        print(f"Uploaded PDF: {key_base}")
    # upload metadata
    meta_tmp = pdf_path.with_suffix('.metadata.json')
    meta_tmp.write_text(json.dumps({"user_id": USER_ID, "project_id": PROJECT_ID}))
    try:
        s3.head_object(Bucket=KB_BUCKET, Key=meta_key)
    except ClientError:
        s3.upload_file(str(meta_tmp), KB_BUCKET, meta_key)
        print(f"Uploaded metadata: {meta_key}")


def start_ingestion_job() -> str:
    resp = agent.start_ingestion_job(
        knowledgeBaseId=KB_ID,
        dataSourceId=DATA_SOURCE_ID,
        clientToken=str(uuid.uuid4()),
        description="starting ingestion"
    )
    ingestion_id = resp.get("ingestionJob", {}).get("id", "")
    print(f"Ingestion job started: {ingestion_id}")
    return ingestion_id


def answer_with_rag(question: str) -> tuple[list[str], str]:
    contexts = retrieve_kb_contexts(
        question, KB_ID, USER_ID, PROJECT_ID, MODEL_ARN, top_k=3
    )
    prompt = (
        "You are a financial analyst.\n"
        f"Question: {question}\n"
        "Context:\n" + "\n---\n".join(contexts) + "\n"
        "Answer briefly and factually."
    )
    resp = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )
    return contexts, resp.choices[0].message.content.strip()

# ── EVALUATION WORKFLOW ──────────────────────────────────────────────────

def run_workflow(
    pdf_path: str,
    query_file: str,
    ground_truth_file: str,
    ingest: bool = False,
    wait_seconds: int = 30
):
    # 1) Ingest document
    pdf = Path(pdf_path)
    if ingest:
        upload_with_metadata(pdf)
        ingestion_id = start_ingestion_job()
        print(f"Waiting {wait_seconds}s for ingestion to complete...")
        time.sleep(wait_seconds)
    else:
        print("Skipping ingestion step.")

    # 2) Load queries and ground truth
    with open(query_file) as fq:
        queries = json.load(fq)
    with open(ground_truth_file) as fg:
        truths = json.load(fg)
    if len(queries) != len(truths):
        raise ValueError("Query and ground truth lists must be same length")

    # 3) Answer and collect
    records = []
    for question, truth in tqdm.tqdm(zip(queries, truths), total=len(queries), desc="RAG Eval"):
        contexts, pred = answer_with_rag(question)
        records.append({
            "question": question,
            "answer": pred,
            "contexts": contexts,
            "ground_truth": truth,
        })

    # 4) Build dataset and compute metrics
    ds = Dataset.from_list(records)
    scores = evaluate(ds, metrics=[faithfulness, answer_correctness])
    df = scores.to_pandas()
    print("┌────── ragas summary ──────")
    print(df.describe())
    print("└───────────────────────────")
    return df

# ── MAIN ENTRYPOINT ─────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Run FinQA RAG evaluation with custom files"
    )
    parser.add_argument(
        "--pdf", required=True,
        help="Local PDF file to upload/ingest into KB"
    )
    parser.add_argument(
        "--queries", required=True,
        help="JSON file of questions (list of strings)"
    )
    parser.add_argument(
        "--truths", required=True,
        help="JSON file of ground truth answers (list of strings)"
    )
    parser.add_argument(
        "--ingest", action="store_true",
        help="Whether to ingest the PDF before evaluation"
    )
    parser.add_argument(
        "--wait", type=int, default=30,
        help="Seconds to wait after ingestion"
    )
    args = parser.parse_args()

    run_workflow(
        pdf_path=args.pdf,
        query_file=args.queries,
        ground_truth_file=args.truths,
        ingest=args.ingest,
        wait_seconds=args.wait
    )
