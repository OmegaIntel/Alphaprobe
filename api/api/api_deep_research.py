import os
from typing import Dict, Any, List
from fastapi import APIRouter, File, UploadFile
from pydantic import BaseModel, Field
from openai import OpenAI
import asyncio
# from google import genai
# from google.genai.types import Tool, GenerateContentConfig, GoogleSearch
from anthropic import AsyncAnthropic
from db_models.OpensearchDB import store_documents, query_index

deep_research_router = APIRouter()


class UserQuery(BaseModel):
    query: str = Field(..., description="The user's query to the deep research API")


async def pdf_search_tool(input: str) -> Dict[str, Any]:
    pdf_data_list = []
    file_content_message = "\n".join(
        pdf_data["file_content"] for pdf_data in pdf_data_list
    )

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an AI assistant. Please answer the user's questions based on given context. If the input is not mentioned in context, output something like 'I don't know'. Use complete sentences and provide accurate information. Answers should be clear, as short as possible, and no need additional information or description.",
                },
                {
                    "role": "user",
                    "content": f"Based on the following text, answer the question:\n\n{file_content_message}\n\nQuestion: {input}\nUse citations to back up your answer.",
                },
            ],
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Error calling pdf search API: {str(e)}"


async def web_search_tool(input: str) -> Dict[str, Any]:
    """
    Given a user question, this tool will visit the top ranked pages on Google and extract information from them.
    It will then concisely answer the question based on the extracted information, and will return the answer as a JSON,
    with a "reference_sources" key that lists the web pages from which the information was extracted and an "answer" key
    that contains the concisely answered question.
    """
    # client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    # google_search_tool = Tool(google_search=GoogleSearch())

    # try:
    #     response = await client.aio.models.generate_content(
    #         model="gemini-2.0-flash",
    #         config=GenerateContentConfig(
    #             tools=[google_search_tool],
    #             response_modalities=["TEXT"],
    #         ),
    #         contents=f"{input}\nNote: you must **always** use the google search tool to answer questions - no exceptions. Answers should be direct, clear, as short as possible, and no need additional information or description.",
    #     )

    #     sources = [
    #         {"source": chunk.web.title, "url": chunk.web.uri}
    #         for candidate in response.candidates
    #         if candidate.grounding_metadata
    #         and candidate.grounding_metadata.grounding_chunks
    #         for chunk in candidate.grounding_metadata.grounding_chunks
    #     ]

    #     return response.text
    # except Exception as e:
    #     return f"Error calling web search API: {str(e)}"


async def anthropic_tool(input: str) -> Dict[str, Any]:
    """
    Given a user question, this tool will use the Anthropics API to generate a response.
    """
    client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    try:
        response = await client.messages.create(
            model="claude-3-7-sonnet-20250219",
            messages=[
                {
                    "role": "user",
                    "content": f"Generate answer for this question: {input}\nAnswers should be direct, clear, as short as possible, and no need additional information or description.",
                }
            ],
            max_tokens=1024,
        )

        return response.content[0].text.strip()
    except Exception as e:
        return f"Error calling Anthropics API: {str(e)}"


async def openai_tool(input: str) -> Dict[str, Any]:
    """
    Given a user question, this tool will attempt to answer the question using the OpenAI API.
    It will return the answer as a JSON.
    """
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an AI assistant that provides concise and direct answers. No need additional information or description.",
                },
                {"role": "user", "content": input.question},
            ],
        )

        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Error calling OpenAI API: {str(e)}"


async def deep_research_tool(input: str, file_status: bool) -> Dict[str, Any]:
    if file_status is True:
        results = await asyncio.gather(
            query_index(input, top_k=5),
            web_search_tool(input),
            anthropic_tool(input),
            openai_tool(input),
        )
    else:
        results = await asyncio.gather(
            web_search_tool(input),
            anthropic_tool(input),
            openai_tool(input),
        )

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are an AI assistant. Please answer the user's questions. Use complete sentences and provide accurate information.",
            },
            {
                "role": "user",
                "content": f"""Your task is to synthesize a series of reports into a final report.

# Context
These reports were generated by several tools. Each tool was given a question and generated a report based on that question. The reports are as follows:
{results}

# Task
Synthesize these intermediate reports done by a group of independent analysts into a final report by combining the insights from each of the reports provided. We only need the direct answer for user's question, no need additional information or description. We don't need **Final Report on ...** and **Reference**.

You should attempt to get the most useful insights from each report, without repeating the insights across reports. Please ensure that you get the actual data insights from these reports, and not just methodologies.
            """,
            },
        ],
    )

    return {"response": response.choices[0].message.content.strip()}


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

        #store_documents(documents_dir=save_directory)
        file_status = True

    try:
        result = {}; #await deep_research_tool(user_query.query, file_status=file_status)
        return result
    except Exception as e:
        return {"response": "Error calling deep research API", "error": str(e)}
