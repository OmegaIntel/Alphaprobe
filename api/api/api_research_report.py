import os
import uuid
import nest_asyncio
import json
import re
import asyncio
from typing import Dict, List, Union

from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

# Adjust these imports as needed for your environment
from api.api_user import get_current_user, User as UserModelSerializer
from db_models.deals import Deal, DealStatus
from db_models.rag_session import RagSession
from db_models.report import Report
from db_models.deals import Deal
from db_models.session import get_db

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

from db_models.opensearch_llamaindex import (
    create_collection,
    update_collection,
    delete_index,
    query_index
)

from common_logging import loginfo, logerror

nest_asyncio.apply()

# -------------------------------------------------------------------------
# 1) LLM & Embedding Setup
# -------------------------------------------------------------------------

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def setup_models():
    """Initialize LLM and embedding models for the workflow."""
    Settings.llm = OpenAI(
        model="gpt-4o-mini",  # Change to your actual model if needed
        temperature=0.1,
        openai_api_key=OPENAI_API_KEY
    )
    # If using text-embedding-ada-002 (1536D), do NOT specify 'dimensions='
    # Let the library detect dimension automatically.
    Settings.embed_model = OpenAIEmbedding(
        model="text-embedding-ada-002",
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

async def generate_structured_report(query: dict, user_id: str, deal_id: str):
    """
    Orchestrates an LLM-based agent with vector retrieval from OpenSearch.
    """
    try:
        setup_models()
        index_name = f"d{deal_id}".lower()

        agent = DocumentResearchAgent(timeout=600, verbose=True, index_name=index_name)
        handler = agent.run(query=query, tools=None)

        final_report = None
        async for ev in handler.stream_events():
            if isinstance(ev, ProgressEvent):
                print("[generate_structured_report] ProgressEvent:\n", ev.progress)
            elif isinstance(ev, StopEvent):
                final_report = ev.result

        return final_report
    except Exception as e:
        logerror(f"Error generating report: {str(e)}")
        return None

class DocumentResearchAgent(Workflow):
    """
    Multi-step workflow for generating a market analysis report
    with OpenSearch retrieval + LLM.
    """
    def __init__(self, timeout=600, verbose=True, index_name=""):
        super().__init__(timeout=timeout, verbose=verbose)
        self.index_name = index_name

    @step()
    async def formulate_plan(self, ctx: Context, ev: StartEvent) -> OutlineEvent:
        data = ev.query
        query_context = data.get("query", "")
        headings = data.get("headings", [])
        headings_text = "\n".join([f"{i+1}. {h}" for i, h in enumerate(headings)]) if headings else "No specific headings provided."

        # Store some items in context
        await ctx.set("original_query", query_context)
        await ctx.set("headings", headings)

        outline_prompt = f"""You are an expert market research analyst.
Create a detailed outline for a comprehensive market analysis report.
The outline should cover:
- Market size and growth trends
- Consumer behavior and segmentation
- Competitive landscape and positioning
- Regulatory environment and economic influences
- Emerging trends and growth opportunities

Provided Headings:
{headings_text}

Query Context: {query_context}

Produce a structured, actionable outline for a complete market analysis.
"""
        print("\n[formulate_plan] Outline Prompt:\n", outline_prompt)
        response = await Settings.llm.acomplete(outline_prompt)
        outline_text = response.text if hasattr(response, "text") else str(response)

        print("\n[formulate_plan] Outline Generated:\n", outline_text)
        ctx.write_event_to_stream(ProgressEvent(progress="Due Diligence Outline:\n" + outline_text))
        return OutlineEvent(outline=outline_text)

    @step()
    async def formulate_questions(self, ctx: Context, ev: OutlineEvent) -> None:
        outline = ev.outline
        await ctx.set("outline", outline)

        question_prompt = f"""As a market research expert, generate up to 15 specific questions (JSON array) 
that will help extract key market insights from the following outline:
{outline}

Output your answer as JSON, e.g.:
["Question 1?", "Question 2?", ...]
"""
        print("\n[formulate_questions] Questions Prompt:\n", question_prompt)
        response = await Settings.llm.acomplete(question_prompt)
        questions_raw = response.text if hasattr(response, "text") else str(response)

        # Strip out possible code fences
        questions_raw = re.sub(r"^```(?:json)?\n", "", questions_raw)
        questions_raw = re.sub(r"\n```$", "", questions_raw)
        try:
            questions = json.loads(questions_raw)
            if not isinstance(questions, list):
                questions = []
        except Exception as e:
            logerror(f"Error parsing JSON questions: {e}")
            questions = [x.strip() for x in questions_raw.split("\n") if x.strip()]

        print(f"\n[formulate_questions] Parsed {len(questions)} questions:\n", questions)
        await ctx.set("num_questions", len(questions))
        await ctx.set("questions", questions)

        # Show them in the progress event
        ctx.write_event_to_stream(
            ProgressEvent(progress="Financial Analysis Questions:\n" + "\n".join(questions))
        )

        # Send each question event
        for q in questions:
            print(f"[formulate_questions] Sending question: {q}")
            ctx.send_event(QuestionEvent(question=q))
            # Short sleep to ensure events get processed in time
            await asyncio.sleep(0.2)

    @step()
    async def answer_questions(self, ctx: Context, ev: QuestionEvent) -> AnswerEvent:
        question = ev.question.strip()
        index = self.index_name

        print(f"\n[answer_questions] Received question:\n'{question}'")
        # >>>>>>>>>>>>> ADDITIONAL LOG HERE <<<<<<<<<<<
        print(f"[answer_questions] Querying index: {index}")

        # Retrieve context from OpenSearch (in a thread, so it won't block the event loop)
        answer_context = await asyncio.to_thread(query_index, question, index, 5)
        if not answer_context:
            answer_context = "Empty Response"
        print(f"[answer_questions] Context for '{question}':\n", answer_context)

        prompt = f"""
You are a market research analyst. You must answer the following question using ONLY the text from this context:
{answer_context}

Question: {question}

If the context does not have enough info, respond with:
'MISSING INFORMATION: The provided context does not contain details to answer this question.'

Answer:
"""
        print("\n[answer_questions] LLM Prompt:\n", prompt)
        response = await Settings.llm.acomplete(prompt)
        answer_text = response.text if hasattr(response, "text") else str(response)

        print(f"[answer_questions] Answer for '{question}':\n", answer_text)
        ctx.write_event_to_stream(
            ProgressEvent(progress=f"Answered: {question}\nAnswer: {answer_text}")
        )

        # Store the result in context
        answer_event = AnswerEvent(question=question, answer=answer_text)
        try:
            collected = await ctx.get("answers")
        except Exception:
            collected = []
        collected.append(answer_event)
        await ctx.set("answers", collected)
        return answer_event

    @step()
    async def write_report(self, ctx: Context, ev: AnswerEvent) -> ReviewEvent:
        """
        Gather all answers, wait a short time for all question events to complete,
        then build a final report with the LLM.
        """
        print("[write_report] Waiting 15 seconds to allow other question events to finish.")
        await asyncio.sleep(15)  # give time for all question events to arrive

        num_questions = await ctx.get("num_questions")
        try:
            all_answers = await ctx.get("answers")
        except Exception:
            all_answers = []

        print(f"[write_report] Found {len(all_answers)} answers. Expected {num_questions} originally.")

        if not all_answers:
            ctx.write_event_to_stream(
                ProgressEvent(progress="No answers found to generate the report.")
            )
            return ReviewEvent(report="No report generated, missing answers.")

        # Log each answer
        for idx, ans in enumerate(all_answers, start=1):
            print(f"[write_report] AnswerEvent {idx}:\n Q: '{ans.question}'\n A: '{ans.answer}'\n")

        # Merge with previously answered (if any)
        try:
            previous_questions = await ctx.get("previous_questions")
        except Exception:
            previous_questions = []
        previous_questions.extend(all_answers)
        await ctx.set("previous_questions", previous_questions)

        outline = await ctx.get("outline")
        # Summarize everything into a final market analysis
        final_prompt = f"""You are a senior market research analyst preparing a comprehensive market analysis report.
Using the following outline and Q&A, create a structured report with:

1. Overview of the market landscape and key trends
2. Detailed insights into market size, segmentation, and growth prospects
3. Analysis of the competitive environment and consumer behavior
4. Identification of emerging opportunities and potential challenges
5. Actionable recommendations for market entry, expansion, or strategic adjustment

Outline:
{outline}

Research Findings:
"""
        for ans in previous_questions:
            final_prompt += f"\nQ: {ans.question}\nA: {ans.answer}\n"

        print("\n[write_report] Final Summarize Prompt:\n", final_prompt)
        response = await Settings.llm.acomplete(final_prompt)
        report_text = response.text if hasattr(response, "text") else str(response)

        print("\n[write_report] Final Report (preview):\n", report_text[:300], "...")

        return ReviewEvent(report=report_text)

    @step()
    async def review_report(self, ctx: Context, ev: ReviewEvent) -> Union[StopEvent, QuestionEvent, None]:
        """
        For testing, we forcibly approve the final report to produce a StopEvent.
        """
        report = ev.report
        print("\n[review_report] Forcing approval for testing.\n")
        return StopEvent(result=report)

# -------------------------------------------------------------------------
# 3) FastAPI Router with Endpoints
# -------------------------------------------------------------------------

document_router = APIRouter()

@document_router.post("/api/generate-report")
async def generate_report(
    query: Dict,
    deal_id: str = Query(..., description="Unique ID of the existing deal"),
    current_user: UserModelSerializer = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user.id

    try:
        print(f"[generate_report] Step 1: Received query: {query}")
        print(f"[generate_report] Step 2: Received deal_id: {deal_id}")
        print("[generate_report] Step 3: Validating deal ID and user...")

        deal = db.query(Deal).filter(Deal.id == deal_id, Deal.user_id == user_id).first()
        if not deal:
            print(f"[generate_report] Deal validation failed for deal_id: {deal_id}")
            raise HTTPException(status_code=404, detail="Deal not found or access denied.")
        
        print("[generate_report] Step 4: Deal validation successful.")
        print("[generate_report] Step 5: Generating structured report...")

        report_content = await generate_structured_report(query, user_id, deal_id)
        if not report_content:
            print("[generate_report] Step 5.1: Report generation failed.")
            raise HTTPException(status_code=404, detail="Failed to generate report.")
        
        print("[generate_report] Step 6: Report generated successfully.")
        print("[generate_report] Step 7: Saving report to database...")
        try:
            new_report = Report(
                deal_id=deal_id,
                report_data=json.dumps(report_content)
            )
            db.add(new_report)
            db.commit()
            db.refresh(new_report)
            print(f"[generate_report] Step 7.1: Report saved with ID: {new_report.id}")
        except Exception as db_error:
            db.rollback()
            print(f"[generate_report] Step 7.2: Database error: {db_error}")
            raise HTTPException(status_code=500, detail=f"Failed to save report: {str(db_error)}")
        
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
        print(f"[generate_report] Error encountered: {str(e)}")
        logerror(f"Error in generate_report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@document_router.get("/api/fetch-reports/{deal_id}")
async def fetch_reports(
    deal_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user.id
    try:
        print(f"[fetch_reports] Step 1: Fetching reports for deal_id: {deal_id}")
        deal = db.query(Deal).filter(Deal.id == deal_id, Deal.user_id == user_id).first()
        if not deal:
            print(f"[fetch_reports] Deal validation failed for deal_id: {deal_id}")
            raise HTTPException(status_code=404, detail="Deal not found or access denied.")
        
        print("[fetch_reports] Step 2: Deal validation successful.")
        reports = db.query(Report).filter(Report.deal_id == deal_id).all()
        print(f"[fetch_reports] Step 3: Found {len(reports)} reports")

        formatted_reports = []
        for report in reports:
            formatted_reports.append({
                "report_id": str(report.id),
                "deal_id": str(report.deal_id),
                "report_data": json.loads(report.report_data),
                "created_at": report.created_at.isoformat(),
                "updated_at": report.updated_at.isoformat()
            })
        print("[fetch_reports] Returning results.")
        return JSONResponse(
            content={
                "message": "Reports fetched successfully",
                "deal_id": deal_id,
                "total_reports": len(reports),
                "reports": formatted_reports
            },
            status_code=200,
        )
    except json.JSONDecodeError as je:
        print(f"[fetch_reports] JSON Decode Error: {str(je)}")
        raise HTTPException(status_code=500, detail="Error parsing report data")
    except Exception as e:
        print(f"[fetch_reports] Error encountered: {str(e)}")
        logerror(f"Error in fetch_reports: {e}")
        raise HTTPException(status_code=500, detail=str(e))
