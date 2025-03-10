# Standard Library Imports
import os
from typing import Any, Dict

# Third-Party Libraries
from google import genai
from google.genai.types import Tool, GenerateContentConfig, GoogleSearch
from anthropic import AsyncAnthropic
from openai import OpenAI
from dotenv import load_dotenv
import asyncio

# Local Application/Library Specific Imports
from tools.analysis_models import UserQuery
from utils.utils_logging import LOGGER
from db.db_create import extract_text_from_pdfs

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


async def web_search_tool(input: UserQuery) -> Dict[str, Any]:
    """
    Given a user question, this tool will visit the top ranked pages on Google and extract information from them.
    It will then concisely answer the question based on the extracted information, and will return the answer as a JSON,
    with a "reference_sources" key that lists the web pages from which the information was extracted and an "answer" key
    that contains the concisely answered question.
    """
    LOGGER.info(f"Web search tool called with question: {input.question}")

    client = genai.Client(api_key=GEMINI_API_KEY)
    google_search_tool = Tool(google_search=GoogleSearch())

    try:
        response = await client.aio.models.generate_content(
            model="gemini-2.0-flash",
            config=GenerateContentConfig(
                tools=[google_search_tool],
                response_modalities=["TEXT"],
            ),
            contents=f"{input.question}\nNote: you must **always** use the google search tool to answer questions - no exceptions. Answers should be direct, clear, as short as possible, and no need additional information or description.",
        )

        sources = [
            {"source": chunk.web.title, "url": chunk.web.uri}
            for candidate in response.candidates
            if candidate.grounding_metadata
            and candidate.grounding_metadata.grounding_chunks
            for chunk in candidate.grounding_metadata.grounding_chunks
        ]

        LOGGER.info(f"Web search result: {response.text}")
        return {"answer": response.text, "reference_sources": sources}
    except Exception as e:
        LOGGER.error(f"Error calling Web Search API: {e}")
        return {
            "answer": "Error calling Web Search API",
            "error": str(e),
            "reference_sources": [],
        }


async def anthropic_tool(input: UserQuery) -> Dict[str, Any]:
    LOGGER.info(f"Calling Anthropic tool with question: {input.question}")
    client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)

    try:
        response = await client.messages.create(
            model="claude-3-7-sonnet-20250219",
            messages=[
                {
                    "role": "user",
                    "content": f"Generate answer for this question: {input.question}\nAnswers should be direct, clear, as short as possible, and no need additional information or description.",
                }
            ],
            max_tokens=4096,
        )
        LOGGER.info(f"Anthropic result: {response.content[0].text.strip()}")
        return {"answer": response.content[0].text.strip()}
    except Exception as e:
        LOGGER.error(f"Error calling Anthropic API: {e}")
        return {"answer": "Error calling Anthropic API", "error": str(e)}


async def openai_api_tool(input: UserQuery) -> Dict[str, Any]:
    """
    Given a user question, this tool will attempt to answer the question using the OpenAI API.
    It will return the answer as a JSON.
    """
    LOGGER.info(f"Calling OpenAI API tool with question: {input.question}")
    client = OpenAI(api_key=OPENAI_API_KEY)

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
        LOGGER.info(f"OpenAI result: {response.choices[0].message.content.strip()}")
        return {"answer": response.choices[0].message.content.strip()}
    except Exception as e:
        LOGGER.error(f"Error calling OpenAI API: {e}")
        return {"answer": "Error calling OpenAI API", "error": str(e)}


async def pdf_search_tool(input: UserQuery) -> Dict[str, Any]:
    """
    Given a user question and a list of PDF ids, this tool will attempt to answer the question from the information that is available in the PDFs.
    It will return the answer as a JSON.
    """
    LOGGER.info(f"Calling PDF Citations tool with question: {input.question}")

    pdf_data_list = extract_text_from_pdfs(
        [
            "pdf/1.pdf",
            "pdf/2.pdf",
            "pdf/3.pdf",
            "pdf/4.pdf",
            "pdf/5.pdf",
            "pdf/6.pdf",
        ]
    )
    file_content_message = "\n".join(
        pdf_data["file_content"] for pdf_data in pdf_data_list
    )

    client = OpenAI(api_key=OPENAI_API_KEY)
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
                    "content": f"Based on the following text, answer the question:\n\n{file_content_message}\n\nQuestion: {input.question}\nUse citations to back up your answer.",
                },
            ],
        )
        LOGGER.info(f"OpenAI result: {response.choices[0].message.content.strip()}")
        return {"answer": response.choices[0].message.content.strip()}
    except Exception as e:
        LOGGER.error(f"Error calling OpenAI API: {e}")
        return {"answer": "Error calling OpenAI API", "error": str(e)}


async def deep_research_tool(user_query: UserQuery) -> Dict[str, Any]:
    pdf_search_result = await pdf_search_tool(user_query)
    if "I don't know" in pdf_search_result["answer"]:
        results = await asyncio.gather(
            web_search_tool(user_query),
            anthropic_tool(user_query),
            openai_api_tool(user_query),
        )

        client = OpenAI(api_key=OPENAI_API_KEY)
        try:
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

            LOGGER.info(
                f"Deep Research result: {response.choices[0].message.content.strip()}"
            )
            return {"answer": response.choices[0].message.content.strip()}
        except Exception as e:
            LOGGER.error(f"Error calling OpenAI API: {e}")
            return {"answer": "Error calling OpenAI API", "error": str(e)}
    else:
        return pdf_search_result
