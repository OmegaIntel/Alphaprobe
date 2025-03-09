# Standard Library Imports
import asyncio
import os
from typing import Any

# Third-Party Libraries
from anthropic import AsyncAnthropic
from google import genai
from google.genai.types import Tool, GenerateContentConfig, GoogleSearch

# Local Application/Library Specific Imports
from tools.analysis_models import (
    AnswerQuestionInput,
    AnswerQuestionViaPDFCitationsInput,
)
from utils.utils_logging import LOGGER
from utils.utils_oracle import get_pdf_content


async def web_search_tool(
    input: AnswerQuestionInput,
) -> dict[str, Any]:
    """
    Given a user question, this tool will visit the top ranked pages on Google and extract information from them.
    It will then concisely answer the question based on the extracted information, and will return the answer as a JSON, with a "reference_sources" key that lists the web pages from which the information was extracted and an "answer" key that contains the concisely answered question.
    It should be used when a question cannot be directly answered by the database, or when additional context can be provided to the user by searching the web.
    """
    LOGGER.info(f"Web search tool called with question: {input.question}")

    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    google_search_tool = Tool(google_search=GoogleSearch())

    try:
        response = await client.aio.models.generate_content(
            model="gemini-2.0-flash",
            config=GenerateContentConfig(
                tools=[google_search_tool],
                response_modalities=["TEXT"],
            ),
            contents=input.question
            + "\nNote: you must **always** use the google search tool to answer questions - no exceptions.",
        )

        LOGGER.info(f"Received response from Gemini API.")

        # Handle the case where grounding_chunks might be None
        sources = []
        if response.candidates:
            for candidate in response.candidates:
                if (
                    candidate.grounding_metadata
                    and candidate.grounding_metadata.grounding_chunks
                ):
                    for chunk in candidate.grounding_metadata.grounding_chunks:
                        sources.append(
                            {"source": chunk.web.title, "url": chunk.web.uri}
                        )
        return {"answer": response.text, "reference_sources": sources}
    except Exception as e:
        LOGGER.error(f"Error calling Gemini API: {e}")
        return {
            "answer": "Error calling Gemini API",
            "error": str(e),
            "reference_sources": [],
        }


async def pdf_citations_tool(
    input: AnswerQuestionViaPDFCitationsInput,
) -> str:
    """
    Given a user question and a list of PDF ids, this tool will attempt to answer the question from the information that is available in the PDFs.
    It will return the answer as a JSON.
    """
    LOGGER.info(
        f"Calling PDF Citations tool with question: {input.question} and PDF ids: {input.pdf_files}"
    )
    client = AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    file_content_messages = []
    for file_id in input.pdf_files:
        pdf_content = await get_pdf_content(file_id)
        title = pdf_content["file_name"]
        base_64_pdf = pdf_content["base64_data"]
        file_content_messages.append(
            {
                "type": "document",
                "source": {
                    "type": "base64",
                    "media_type": "application/pdf",
                    "data": base_64_pdf,
                },
                "title": title,
                "citations": {"enabled": True},
                "cache_control": {"type": "ephemeral"},
            }
        )

    messages = [
        {
            "role": "user",
            "content": file_content_messages
            + [
                {
                    "type": "text",
                    "text": input.question + "\nUse citations to back up your answer",
                }
            ],
        }
    ]

    response = await client.messages.create(
        model="claude-3-7-sonnet-latest",
        messages=messages,
        max_tokens=4096,
    )
    return [item.to_dict() for item in response.content]


async def main():
    web_search_input_data = AnswerQuestionInput(
        question="What is the capital of France?",
    )
    result = await web_search_tool(web_search_input_data)
    print(result)

    pdf_search_input_data = AnswerQuestionViaPDFCitationsInput(
        question="What are the main findings in the provided research papers?",
        pdf_files=[1, 2, 3],  # Example PDF file IDs
    )
    result = await pdf_citations_tool(pdf_search_input_data)
    print(result)


asyncio.run(main())
