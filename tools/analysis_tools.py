# Standard Library Imports
import asyncio
import os
from typing import Any

# Third-Party Libraries
from anthropic import AsyncAnthropic
from google import genai
from google.genai.types import Tool, GenerateContentConfig, GoogleSearch

# Local Application/Library Specific Imports
from tools.analysis_models import AnswerQuestionInput
from utils.utils_logging import LOGGER


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


async def main():
    input_data = AnswerQuestionInput(
        question="What is the capital of France?",
    )
    result = await web_search_tool(input_data)
    print(result)


asyncio.run(main())
