import os, json, requests, boto3, tqdm, uuid, time
from pathlib import Path
from datasets import load_dataset, Dataset
from botocore.exceptions import ClientError
from requests.exceptions import HTTPError
from ragas import evaluate
from ragas.metrics import faithfulness, answer_correctness
from openai import OpenAI
import sys, pathlib

def add_repo_root(repo_name: str = "Alphaprobe") -> None:
    """
    Walk up from this file until we find a folder called *repo_name*
    and append it to sys.path so that `import api...` works.
    """
    print(f"Adding repo root to sys.path: {repo_name}")
    here = pathlib.Path(__file__).resolve()
    for parent in [here, *here.parents]:
        if parent.name == repo_name:
            sys.path.append(str(parent))
            return
    raise RuntimeError(f"Could not locate repo root named '{repo_name}'")

# call once, before any project-internal imports
add_repo_root()

from api.utils.aws_utils import AwsUtils
from api.utils.kb_search import retrieve_kb_contexts

# ── CONSTANTS ───────────────────────────────────────────────────────────
KB_BUCKET       = "kb-bucket-tester"
S3_PREFIX       = "test-data/finqa"
KB_ID           = "YHYCE7GDL7"
DATA_SOURCE_ID   = "DRPSJMJJ75"
USER_ID         = "rushil"
PROJECT_ID      = "finqa-demo"
MODEL_ARN       = os.getenv("MODEL_ARN")  # must be set
PDF_BASE        = "https://raw.githubusercontent.com/cunchi423/FinQA/main/dataset/pdf/"
TMP_DIR         = Path("/tmp/finqa")

if not MODEL_ARN:
    raise EnvironmentError("MODEL_ARN environment variable is not set")
if "OPENAI_API_KEY" not in os.environ:
    raise EnvironmentError("OPENAI_API_KEY environment variable is not set")

# ── AWS CLIENTS ─────────────────────────────────────────────────────────
s3     = boto3.client("s3")
agent  = AwsUtils.get_bedrock_agent()

# ── HELPERS ──────────────────────────────────────────────────────────────
def fetch_finqa_slice(split: str = "validation[:100]"):
    return load_dataset("dreamerdeo/finqa", split=split)

def download_pdf(doc_id: str, tmp_dir: Path = TMP_DIR) -> Path:
    base     = doc_id.rsplit("-", 1)[0]
    filename = Path(base).name
    tmp_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = tmp_dir / filename
    if not pdf_path.exists():
        url = f"{PDF_BASE}{base}"
        r   = requests.get(url, timeout=30)
        r.raise_for_status()
        pdf_path.write_bytes(r.content)
        print(f"✓ downloaded {pdf_path.name}")
    return pdf_path

def upload_with_metadata(pdf_path: Path):
    key_base = f"{S3_PREFIX}/{pdf_path.name}"
    meta_key = f"{key_base}.metadata.json"

    # 1) upload the PDF itself (with S3 object metadata)
    try:
        s3.head_object(Bucket=KB_BUCKET, Key=key_base)
    except ClientError:
        s3.upload_file(
            Filename=str(pdf_path),
            Bucket=KB_BUCKET,
            Key=key_base,
            ExtraArgs={"Metadata": {
                "user_id":    USER_ID,
                "project_id": PROJECT_ID,
            }},
        )
        print(f"↑ uploaded  {key_base}")

    # 2) upload the companion metadata JSON
    meta_json = {"user_id": USER_ID, "project_id": PROJECT_ID}
    meta_tmp  = pdf_path.with_suffix(".metadata.json")
    meta_tmp.write_text(json.dumps(meta_json))

    try:
        s3.head_object(Bucket=KB_BUCKET, Key=meta_key)
    except ClientError:
        s3.upload_file(str(meta_tmp), KB_BUCKET, meta_key)
        print(f"↑ uploaded  {meta_key}")

def start_ingestion_job() -> str:
    """
    Kick off a Bedrock ingestion that indexes the S3 object metadata
    under 'user_id' and 'project_id' as STRING_VALUE fields.
    """
    resp = agent.start_ingestion_job(
            knowledgeBaseId=KB_ID,
            dataSourceId=DATA_SOURCE_ID,
            clientToken=str(uuid.uuid4()),
            description="starting ingestion",
        )
    return resp.get("ingestionJob", {}).get("id", "")

# ── RAG ANSWERING ───────────────────────────────────────────────────────
openai_client = OpenAI()  # uses OPENAI_API_KEY

def answer_with_rag(question: str) -> tuple[list[str], str]:
    ctxs = retrieve_kb_contexts(
        question, KB_ID, USER_ID, PROJECT_ID, MODEL_ARN, top_k=3
    )
    prompt = (
        "You are a financial analyst.\n"
        f"Question: {question}\n"
        "Context:\n" + "\n---\n".join(ctxs) + "\n"
        "Answer briefly and factually."
    )
    resp = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
    )
    return ctxs, resp.choices[0].message.content.strip()

# ── END-TO-END DRIVER ────────────────────────────────────────────────────
def run_finqa_rag_eval(
    split: str = "validation[:50]",
    ingest: bool = False,
):
    if ingest:
        raw_slice = fetch_finqa_slice(split)
        for doc_id in raw_slice.unique("id"):
            try:
                pdf_path = download_pdf(doc_id)
            except HTTPError as e:
                print(f"⚠️ missing PDF for {doc_id}, skipping ({e})")
                continue

            upload_with_metadata(pdf_path)

        # **now** start and wait for ingestion
        start_ingestion_job()

    # evaluation (no changes)
    raw_slice = fetch_finqa_slice(split)
    records   = []
    for row in tqdm.tqdm(raw_slice, desc="Answering"):
        contexts, gen_ans = answer_with_rag(row["question"])
        records.append({
            "question":     row["question"],
            "answer":       gen_ans,
            "contexts":     contexts,
            "ground_truth": row["answer"],
        })

    eval_ds = Dataset.from_list(records)
    scores  = evaluate(eval_ds, metrics=[faithfulness, answer_correctness])
    df      = scores.to_pandas()

    print("┌────── ragas summary ──────")
    print(df.describe())
    print("└───────────────────────────")
    return df

# ── RUN ─────────────────────────────────────────────────────────────────
run_finqa_rag_eval(split="validation[:100]", ingest=False)
