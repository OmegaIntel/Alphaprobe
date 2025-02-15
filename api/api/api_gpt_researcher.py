import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from gpt_researcher import GPTResearcher

gpt_router = APIRouter()

class QueryPayload(BaseModel):
    query: str

async def generate_report(query: str) -> str:
    """
    Asynchronously generates a research report for the provided query.
    """
    researcher = GPTResearcher(query=query, report_type="research_report")
    
    # Conduct research based on the query
    await researcher.conduct_research()
    
    # Generate the final report
    report = await researcher.write_report()
    
    return report

@gpt_router.post("/api/gpt-report")
async def get_report(payload: QueryPayload):
    """
    API endpoint that accepts a JSON payload with a 'query' field,
    then returns a generated research report.
    """
    try:
        report = await generate_report(payload.query)
        return {"report": report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
