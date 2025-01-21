import os
import uuid
import nest_asyncio
from typing import Dict, List, Union

from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from api.api_user import get_current_user
from db_models.deals import Deal, DealStatus
from db_models.rag_session import RagSession
from db_models.report import Report
from db_models.session import get_db
import json
import asyncio

from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.core import Settings
from llama_index.core.workflow import (
    step,
    Event,
    Context,
    StartEvent,
    StopEvent,
    Workflow,
)

from api.api_user import get_current_user, User as UserModelSerializer
from db_models.OpensearchDB import OpenSearchManager
from common_logging import loginfo, logerror

nest_asyncio.apply()

# -------------------------------------------------------------------------
# 1) LLM & Embedding Setup
# -------------------------------------------------------------------------

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def setup_models():
    """Initialize LLM and embedding models for the workflow."""
    Settings.llm = OpenAI(
        model="gpt-4-turbo",  # Updated to a valid model name
        temperature=0.1,
        openai_api_key=OPENAI_API_KEY
    )
    Settings.embed_model = OpenAIEmbedding(
        model="text-embedding-3-large",
        dimensions=1024,
        openai_api_key=OPENAI_API_KEY
    )

# -------------------------------------------------------------------------
# 2) Workflow Classes & Agent
# -------------------------------------------------------------------------

class OutlineEvent(Event):
    outline: str

class QuestionEvent(Event):
    question: str

class AnswerEvent(Event):
    question: str
    answer: str

class ReviewEvent(Event):
    report: str

class ProgressEvent(Event):
    progress: str

opensearch_manager = OpenSearchManager()

async def generate_structured_report(query: dict, user_id: str, deal_id: str):
    """
    Generate a due diligence report by orchestrating an LLM-based agent with
    vector retrieval from OpenSearch.
    """
    try:
        setup_models()
        index_name = f"d{deal_id}".lower()
        agent = DocumentResearchAgent(timeout=600, verbose=True, index_name=index_name)
        handler = agent.run(query=query, tools=None)

        final_report = None
        async for ev in handler.stream_events():
            if isinstance(ev, ProgressEvent):
                print(ev.progress)
            elif isinstance(ev, StopEvent):
                final_report = ev.result

        return final_report
    except Exception as e:
        logerror(f"Error generating report: {str(e)}")
        return None

class DocumentResearchAgent(Workflow):
    """
    Financial Due Diligence Report Generation Workflow.
    """
    def __init__(self, timeout=600, verbose=True, index_name=""):
        super().__init__(timeout=timeout, verbose=verbose)
        self.index_name = index_name

    @step()
    async def formulate_plan(self, ctx: Context, ev: StartEvent) -> OutlineEvent:
        data = ev.query
        query_context = data.get("query", "")
        headings = data.get("headings", [])

        if headings:
            headings_text = "\n".join([f"{i+1}. {heading}" for i, heading in enumerate(headings)])
        else:
            headings_text = "No specific headings provided."

        await ctx.set("original_query", query_context)
        await ctx.set("headings", headings)

        prompt = f"""You are an expert financial analyst conducting research and due diligence.
        Create a detailed outline for a comprehensive due diligence report. The outline should
        reflect standard due diligence practices and cover critical areas of financial analysis.

        Provided Headings:
        {headings_text}

        Query Context: {query_context}

        Produce a structured, actionable outline for thorough financial diligence.
        """
        response = await Settings.llm.acomplete(prompt)
        outline_text = response.text if hasattr(response, "text") else str(response)

        ctx.write_event_to_stream(
            ProgressEvent(progress="Due Diligence Outline:\n" + outline_text)
        )
        return OutlineEvent(outline=outline_text)

    # ... [Other methods remain the same] ...

# -------------------------------------------------------------------------
# 3) FastAPI Router with Endpoints
# -------------------------------------------------------------------------

document_router = APIRouter()

@document_router.post("/api/generate-report")
async def generate_report(
    query: Dict,
    deal_id: str = Query(..., description="Unique ID of the existing deal"),
    current_user: UserModelSerializer = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a comprehensive due diligence report."""
    user_id = current_user.id

    try:
        deal = db.query(Deal).filter(Deal.id == deal_id, Deal.user_id == user_id).first()
        if not deal:
            raise HTTPException(status_code=404, detail="Deal not found or access denied.")

        report_content = await generate_structured_report(query, user_id, deal_id)
        if not report_content:
            raise HTTPException(status_code=404, detail="Failed to generate report.")

        new_report = Report(
            deal_id=deal_id,
            report_data=json.dumps(report_content)
        )
        db.add(new_report)
        db.commit()
        db.refresh(new_report)

        return JSONResponse(
            content={
                "message": "Report generated and saved successfully",
                "deal_id": str(deal_id),
                "report_id": str(new_report.id),
                "report": report_content,
            },
            status_code=200,
        )
    except Exception as e:
        logerror(f"Error in generate_report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@document_router.get("/api/fetch-reports/{deal_id}")
async def fetch_reports(
    deal_id: str,
    current_user: UserModelSerializer = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve previously stored reports."""
    try:
        user_id = current_user.id
        deal = db.query(Deal).filter(Deal.id == deal_id, Deal.user_id == user_id).first()
        if not deal:
            raise HTTPException(status_code=404, detail="Deal not found or access denied.")

        reports = db.query(Report).filter(Report.deal_id == deal_id).all()
        formatted_reports = [
            {
                "report_id": str(report.id),
                "deal_id": str(report.deal_id),
                "report_data": json.loads(report.report_data),
                "created_at": report.created_at.isoformat(),
                "updated_at": report.updated_at.isoformat()
            }
            for report in reports
        ]

        return JSONResponse(
            content={
                "message": "Reports fetched successfully",
                "deal_id": deal_id,
                "total_reports": len(reports),
                "reports": formatted_reports
            },
            status_code=200
        )
    except json.JSONDecodeError as je:
        raise HTTPException(status_code=500, detail="Error parsing report data")
    except Exception as e:
        logerror(f"Error in fetch_reports: {e}")
        raise HTTPException(status_code=500, detail=str(e))