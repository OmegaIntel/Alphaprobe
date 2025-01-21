import os
import uuid
import nest_asyncio
from typing import Dict, List, Union

from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
<<<<<<< HEAD
from typing import List, Dict
from datetime import datetime, timedelta
from api.api_user import get_current_user
from db_models.deals import Deal, DealStatus
from db_models.rag_session import RagSession
from db_models.report import Report
from db_models.deals import Deal 
from db_models.session import get_db
import json
import os
import asyncio
=======
>>>>>>> 1368855b01083df01b391ed1111671dbf7182186

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

from db_models.deals import Deal
from db_models.session import get_db
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
        model="gpt-4o-mini",  # Example; change to the actual model you use
        temperature=0.1,
        openai_api_key=OPENAI_API_KEY
    )
    # Keep an embedding model in case we need it in prompts
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

        # Typically you might name your OpenSearch index after the deal_id.
        index_name = f"d{deal_id}".lower()

        # Create and run the agent
        agent = DocumentResearchAgent(timeout=600, verbose=True, index_name=index_name)
        handler = agent.run(query=query, tools=None)

        final_report = None
        async for ev in handler.stream_events():
            if isinstance(ev, ProgressEvent):
                print(ev.progress)  # or use loginfo(ev.progress)
            elif isinstance(ev, StopEvent):
                final_report = ev.result

        return final_report
    except Exception as e:
        logerror(f"Error generating report: {str(e)}")
        return None

class DocumentResearchAgent(Workflow):
    """
    Financial Due Diligence Report Generation Workflow.
    Uses an OpenSearch index (self.index_name) for k-NN vector search,
    then synthesizes a final report via multiple LLM steps.
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

    @step()
    async def formulate_questions(self, ctx: Context, ev: OutlineEvent) -> None:
        outline = ev.outline
        await ctx.set("outline", outline)

        prompt = f"""As a financial expert, create specific questions to extract critical
        financial information from the company documents. Limit to about 15 key questions.

        Outline to analyze:
        {outline}
        """
        response = await Settings.llm.acomplete(prompt)
        questions_raw = response.text if hasattr(response, "text") else str(response)
        questions = [x.strip() for x in questions_raw.split("\n") if x.strip()]

        await ctx.set("num_questions", len(questions))
        ctx.write_event_to_stream(
            ProgressEvent(progress="Financial Analysis Questions:\n" + "\n".join(questions))
        )
        for q in questions:
            ctx.send_event(QuestionEvent(question=q))

    @step()
    async def answer_questions(self, ctx: Context, ev: QuestionEvent) -> AnswerEvent:
        """
        k-NN vector search in OpenSearch for context, then feed context + question to LLM.
        """
        question = ev.question
        top_chunks = opensearch_manager.knn_search(self.index_name, question, top_k=10)
        context_text = "\n".join(top_chunks)

        prompt = f"""You are a financial analyst. Provide a detailed answer to the question:

        Question: {question}

        Context (retrieved from documents):
        {context_text}

        Answer:
        """
        response = await Settings.llm.acomplete(prompt)
        answer_text = response.text if hasattr(response, "text") else str(response)

        ctx.write_event_to_stream(
            ProgressEvent(progress=f"Answered: {question}\nAnswer: {answer_text}")
        )
        return AnswerEvent(question=question, answer=answer_text)

    @step()
    async def write_report(self, ctx: Context, ev: AnswerEvent) -> ReviewEvent:
        """
        Gather all answers and build a draft report.
        """
        num_questions = await ctx.get("num_questions")
        all_answers = ctx.collect_events(ev, expected=[AnswerEvent])
        results = all_answers[:num_questions]

        if not results:
            ctx.write_event_to_stream(
                ProgressEvent(progress="No answers found to generate the report.")
            )
            return ReviewEvent(report="No report generated, missing answers.")

        # Accumulate these answers so we can pass them into the final summary prompt
        try:
            previous_questions = await ctx.get("previous_questions")
        except Exception:
            previous_questions = []

        previous_questions.extend(results)
        await ctx.set("previous_questions", previous_questions)

        outline = await ctx.get('outline')
        prompt = f"""You are a senior financial analyst preparing a comprehensive due diligence report.
        Using the provided research findings, create a structured financial report that includes:
        
        1. Clear, professional formatting
        2. Detailed financial analysis with specific data points
        3. Potential risks and red flags
        4. Actionable conclusions and recommendations

        Outline: {outline}

        Research Findings:
        """
        for ans in previous_questions:
            prompt += f"\nQ: {ans.question}\nA: {ans.answer}\n"

        ctx.write_event_to_stream(
            ProgressEvent(progress="Generating Diligence Report...")
        )

        response = await Settings.llm.acomplete(prompt)
        report_text = response.text if hasattr(response, "text") else str(response)

        return ReviewEvent(report=report_text)

    @step()
    async def review_report(self, ctx: Context, ev: ReviewEvent) -> Union[StopEvent, QuestionEvent, None]:
        """
        Final review step. If 'APPROVED', we stop. Else we ask more questions.
        """
        try:
            num_reviews = await ctx.get("num_reviews")
        except Exception:
            num_reviews = 0
        num_reviews += 1
        await ctx.set("num_reviews", num_reviews)

        report = ev.report
        original_query = await ctx.get("original_query")
        prompt = f"""Review this due diligence report for completeness and accuracy.
        Original Request: '{original_query}'

        Report:
        {report}

        If the report meets professional standards, respond with 'APPROVED'.
        Otherwise, list up to 3 follow-up questions to improve it.
        """
        response = await Settings.llm.acomplete(prompt)
        result_text = response.text if hasattr(response, "text") else str(response)

        cleaned_result = result_text.strip().upper()
        if cleaned_result == "APPROVED" or num_reviews >= 3:
            ctx.write_event_to_stream(ProgressEvent(progress="Report Approved."))
            return StopEvent(result=report)
        else:
            # The LLM presumably returned additional questions
            followup_questions = [line.strip() for line in result_text.split("\n") if line.strip()]
            await ctx.set("num_questions", len(followup_questions))
            ctx.write_event_to_stream(ProgressEvent(progress="Additional analysis required."))
            for fq in followup_questions:
                ctx.send_event(QuestionEvent(question=fq))
            return None

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
    """
    Generate a comprehensive due diligence report by orchestrating an LLM-based agent
    and retrieving relevant text from OpenSearch.
    """
    user_id = current_user.id

    try:
<<<<<<< HEAD
        print(f"Step 1: Received query: {query}")
        print(f"Step 2: Received deal_id: {deal_id}")

        # Validate the deal ID and ensure it belongs to the user
        print("Step 3: Validating deal ID and user...")
        deal = db.query(Deal).filter(Deal.id == deal_id, Deal.user_id == user_id).first()
        if not deal:
            print(f"Step 3.1: Deal validation failed for deal_id: {deal_id}")
            raise HTTPException(status_code=404, detail="Deal not found or access denied.")
        
        print("Step 4: Deal validation successful.")

        # Generate the structured report
        print("Step 5: Generating structured report...")
        report_content = await generate_structured_report(query, user_id, deal_id)

        if not report_content:
            print("Step 5.1: Report generation failed.")
            raise HTTPException(status_code=404, detail="Failed to generate report.")
        
        print("Step 6: Report generated successfully.")

        # Create a new report record in the database
        print("Step 7: Saving report to database...")
        try:
            new_report = Report(
                deal_id=deal_id,  # UUID will be auto-generated by model's default value
                report_data=json.dumps(report_content)  # Convert dict to JSON string
            )
            db.add(new_report)
            db.commit()
            db.refresh(new_report)  # Refresh to get the generated ID
            print(f"Step 7.1: Report saved with ID: {new_report.id}")
        except Exception as db_error:
            db.rollback()
            print(f"Step 7.2: Database error: {str(db_error)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save report to database: {str(db_error)}"
            )
=======
        # Validate the deal belongs to the user (or is shared, if applicable).
        deal = db.query(Deal).filter(Deal.id == deal_id, Deal.user_id == user_id).first()
        if not deal:
            raise HTTPException(
                status_code=404,
                detail="Deal not found or you do not have access to it."
            )

        report = await generate_structured_report(query, user_id, deal_id)
        if not report:
            raise HTTPException(status_code=404, detail="Failed to generate report.")
>>>>>>> 1368855b01083df01b391ed1111671dbf7182186

        return JSONResponse(
            content={
                "message": "Report generated and saved successfully",
                "deal_id": str(deal_id),  # Convert UUID to string for JSON response
                "report_id": str(new_report.id),  # Convert UUID to string for JSON response
                "report": report_content,
            },
            status_code=200,
        )
    except Exception as e:
<<<<<<< HEAD
        print(f"Error encountered: {str(e)}")
=======
>>>>>>> 1368855b01083df01b391ed1111671dbf7182186
        logerror(f"Error in generate_report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


<<<<<<< HEAD
# Endpoint to retrieve the generated report
@document_router.get("/api/fetch-reports/{deal_id}")
async def fetch_reports(
    deal_id: str,
    current_user=Depends(get_current_user),
=======
@document_router.get("/api/get-report")
async def get_report(
    session_id: str = Query(..., description="Session ID (if used)"),
    current_user: UserModelSerializer = Depends(get_current_user),
>>>>>>> 1368855b01083df01b391ed1111671dbf7182186
    db: Session = Depends(get_db),
):
    """
    Example endpoint to retrieve a previously stored or cached report.
    (If your app uses sessions or stores final reports in DB, adapt accordingly.)
    """
    try:
<<<<<<< HEAD
        print(f"Step 1: Fetching reports for deal_id: {deal_id}")

        # First validate if the user has access to this deal
        deal = db.query(Deal).filter(Deal.id == deal_id, Deal.user_id == user_id).first()
        if not deal:
            print(f"Step 1.1: Deal validation failed for deal_id: {deal_id}")
            raise HTTPException(status_code=404, detail="Deal not found or access denied.")
        
        print("Step 2: Deal validation successful.")

        # Fetch all reports for this deal
        reports = db.query(Report).filter(Report.deal_id == deal_id).all()
        print(f"Step 3: Found {len(reports)} reports")

        # Format the response
        formatted_reports = []
        for report in reports:
            formatted_reports.append({
                "report_id": str(report.id),
                "deal_id": str(report.deal_id),
                "report_data": json.loads(report.report_data),  # Convert JSON string back to dict
                "created_at": report.created_at.isoformat(),
                "updated_at": report.updated_at.isoformat()
            })

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
        print(f"JSON Decode Error: {str(je)}")
        raise HTTPException(
            status_code=500, 
            detail="Error parsing report data"
=======
        # Replace with your real logic for retrieving the saved report.
        # E.g. querying a RagSession or some cache. For now, a placeholder:
        return JSONResponse(
            content={
                "message": "Report retrieved successfully",
                "report": f"Placeholder for session {session_id}"
            },
            status_code=200,
>>>>>>> 1368855b01083df01b391ed1111671dbf7182186
        )
    except Exception as e:
        print(f"Error encountered: {str(e)}")
        logerror(f"Error in fetch_reports: {e}")
        raise HTTPException(status_code=500, detail=str(e))
