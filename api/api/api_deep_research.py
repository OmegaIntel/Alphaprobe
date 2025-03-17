import os
from typing import Dict, Any, List
from fastapi import APIRouter, File, UploadFile
from pydantic import BaseModel, Field
from google import genai
from google.genai.types import Tool, GenerateContentConfig, GoogleSearch
from anthropic import AsyncAnthropic
from db_models.OpensearchDB import store_documents, query_index

from api.utils.configuration import Configuration
from api.utils.prompts import *

deep_research_router = APIRouter()


class UserQuery(BaseModel):
    query: str = Field(..., description="The user's query to the deep research API")


async def generate_report_plan(pdf_content: str, user_query: str):
    # Get configuration
    configurable = Configuration()
    report_structure = configurable.report_structure
    number_of_queries = configurable.number_of_queries

    # Convert JSON object to string if necessary
    if isinstance(report_structure, dict):
        report_structure = str(report_structure)

    # Format system instructions
    system_instructions_query = report_planner_query_writer_instructions.format(
        topic=user_query,
        report_organization=report_structure,
        number_of_queries=number_of_queries,
    )

    client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    try:
        anthropic_response = await client.messages.create(
            model="claude-3-7-sonnet-20250219",
            system=system_instructions_query,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": f"Generate search queries that will help with planning the sections of the report.",
                        }
                    ],
                },
            ],
            max_tokens=1024,
        )
    except Exception as e:
        return f"Error calling Anthropics API: {str(e)}"

    web_search_query = anthropic_response.content[0].text.strip()

    pdf_instructions_sections = report_planner_instructions.format(
        topic=user_query,
        report_organization=report_structure,
        context=pdf_content,
        feedback=None,
    )

    web_search_instructions_sections = report_planner_instructions.format(
        topic=user_query,
        report_organization=report_structure,
        context=web_search_query,
        feedback=None,
    )

    planner_message = """Generate the sections of the report. Your response must include a 'sections' field containing a list of sections. 
                        Each section must have: name, description, plan, research, and content fields."""

    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    google_search_tool = Tool(google_search=GoogleSearch())

    try:
        gemini_response = await client.aio.models.generate_content(
            model="gemini-2.0-flash",
            config=GenerateContentConfig(
                tools=[google_search_tool],
                response_modalities=["TEXT"],
            ),
            contents=f"There are 2 report planner instructions: {pdf_instructions_sections}\n{web_search_instructions_sections}\nThis is planner message: {planner_message}",
        )
        return gemini_response.text
    except Exception as e:
        return f"Error calling web search API: {str(e)}"


async def deep_research_tool(user_query: str, file_status: bool) -> Dict[str, Any]:
    if file_status is True:
        pdf_content = query_index(user_query, top_k=5)
        report_plan = await generate_report_plan(pdf_content, user_query)
        return {"response": report_plan}


@deep_research_router.get("/api/deep-research/")
async def deep_research(user_query: UserQuery, files: List[UploadFile] = File(None)):
    file_status = False

    if files:
        save_directory = "./api/unit_tests/dir"
        os.makedirs(save_directory, exist_ok=True)

        for file in files:
            file_path = os.path.join(save_directory, file.filename)
            with open(file_path, "wb") as f:
                f.write(await file.read())

        store_documents(documents_dir=save_directory)
        file_status = True

    try:
        result = await deep_research_tool(user_query.query, file_status=file_status)
        return result
    except Exception as e:
        return {"response": "Error calling deep research API", "error": str(e)}
