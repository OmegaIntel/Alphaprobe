import asyncio
from typing import cast, Any, Literal
import json

from fastapi import HTTPException
from tavily import AsyncTavilyClient
from langchain_anthropic import ChatAnthropic
from langchain_core.rate_limiters import InMemoryRateLimiter
from langchain_core.runnables import RunnableConfig
from langgraph.graph import START, END, StateGraph
from pydantic import BaseModel, Field

from api.agent.configuration import Configuration
from api.agent.state import InputState, OutputState, OverallState
from api.agent.utils import deduplicate_and_format_sources, format_all_notes
from api.agent.prompts import (
    EXTRACTION_PROMPT,
    REFLECTION_PROMPT,
    INFO_PROMPT,
    QUERY_WRITER_PROMPT,
)
import requests

from dotenv import load_dotenv
import os

load_dotenv()

# Now you can access the environment variables
tavily_api_key = os.getenv("TAVILY_API_KEY")
anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")

# LLMs

rate_limiter = InMemoryRateLimiter(
    requests_per_second=4,
    check_every_n_seconds=0.1,
    max_bucket_size=10,  # Controls the maximum burst size.
)
claude_3_5_sonnet = ChatAnthropic(
    model="claude-3-5-sonnet-latest", temperature=0, rate_limiter=rate_limiter
)

# Search
tavily_async_client = AsyncTavilyClient()


class Queries(BaseModel):
    queries: list[str] = Field(
        description="List of search queries.",
    )


class ReflectionOutput(BaseModel):
    is_satisfactory: bool = Field(
        description="True if all required fields are well populated, False otherwise"
    )
    missing_fields: list[str] = Field(
        description="List of field names that are missing or incomplete"
    )
    search_queries: list[str] = Field(
        description="If is_satisfactory is False, provide 1-3 targeted search queries to find the missing information"
    )
    reasoning: str = Field(description="Brief explanation of the assessment")


def generate_queries(state: OverallState, config: RunnableConfig) -> dict[str, Any]:
    """Generate search queries directly using the Anthropic Claude API."""
    print("Generating search queries via API.")

    # Get configuration
    configurable = Configuration.from_runnable_config(config)
    max_search_queries = configurable.max_search_queries
    print(f"Max search queries: {max_search_queries}")

    # Prepare the prompt
    query_instructions = QUERY_WRITER_PROMPT.format(
        company=state.company,
        info=json.dumps(state.extraction_schema, indent=2),
        user_notes=state.user_notes,
        max_search_queries=max_search_queries,
    )
    print(f"Query instructions: {query_instructions}")

    # API payload
    payload = {
        "prompt": query_instructions,
        "model": "claude-3-5-sonnet",  # Replace with the correct model version if needed
        "max_tokens_to_sample": 1000,
        "temperature": 0.0,
        "stop_sequences": ["\n\n"],
    }
    
    headers = {
        "Authorization": f"Bearer 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",
        "Content-Type": "application/json",
    }

    # API endpoint
    url = "https://api.anthropic.com/v1/complete"

    try:
        # Send the request
        print("Sending request to Anthropic API.")
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        
        # Parse the response
        response_data = response.json()
        print(f"Response from Anthropic: {json.dumps(response_data, indent=2)}")

        # Extract queries from the response
        generated_queries = response_data.get("completion", "").split("\n")
        print(f"Generated queries: {generated_queries}")
        return {"search_queries": generated_queries}

    except requests.RequestException as e:
        print(f"Error while calling the Anthropic API: {e}")
        raise HTTPException(status_code=500, detail="Error generating search queries.")


async def research_company(
    state: OverallState, config: RunnableConfig
) -> dict[str, Any]:
    """Execute a multi-step web search and information extraction process.

    This function performs the following steps:
    1. Executes concurrent web searches using the Tavily API
    2. Deduplicates and formats the search results
    """
    print("Starting research_company process.")

    # Get configuration
    configurable = Configuration.from_runnable_config(config)
    max_search_results = configurable.max_search_results

    # Define the API headers
    headers = {
        "Content-Type": "application/json",
        "x-api-key": tavily_api_key,
    }

    # Initialize a list for search results
    search_results = []

    # Iterate through search queries
    for query in state.search_queries:
        payload = {
            "query": query,
            "api_key": tavily_api_key,
            "search_depth": "basic",
            "topic": "general",
            "include_answer": True,
            "include_raw_content": False,
            "include_images": False,
            "include_image_descriptions": False,
            "include_domains": [],
            "max_results": max_search_results,
        }

        try:
            print(f"Sending payload to Tavily: {json.dumps(payload, indent=2)}")
            response = requests.post("https://api.tavily.com/search", headers=headers, json=payload)
            response.raise_for_status()  # Raise an HTTPError for bad responses (4xx and 5xx)

            # Log the response
            print(f"Tavily API Response: {response.status_code} - {response.json()}")

            # Append the results to the search_results list
            search_results.append(response.json())
        except requests.RequestException as e:
            print(f"Error generating search queries with Tavily: {e}")
            raise HTTPException(status_code=500, detail="Error generating search queries.")

    # Execute all searches concurrently
    print("Executing Tavily search queries concurrently.")
    search_docs = await asyncio.gather(*search_results)

    # Deduplicate and format sources
    print("Deduplicating and formatting sources.")
    source_str = deduplicate_and_format_sources(
        search_docs, max_tokens_per_source=1000, include_raw_content=True
    )

    # Generate structured notes relevant to the extraction schema
    p = INFO_PROMPT.format(
        info=json.dumps(state.extraction_schema, indent=2),
        content=source_str,
        company=state.company,
        user_notes=state.user_notes,
    )
    print(f"Formatted prompt for structured notes: {p}")
    result = await claude_3_5_sonnet.ainvoke(p)
    print("Completed notes generation.")
    return {"completed_notes": [str(result.content)]}


def gather_notes_extract_schema(state: OverallState) -> dict[str, Any]:
    """Gather notes from the web search and extract the schema fields."""
    print("Gathering notes and extracting schema fields.")

    # Format all notes
    notes = format_all_notes(state.completed_notes)
    print(f"Formatted notes: {notes}")

    # Extract schema fields
    system_prompt = EXTRACTION_PROMPT.format(
        info=json.dumps(state.extraction_schema, indent=2), notes=notes
    )
    structured_llm = claude_3_5_sonnet.with_structured_output(state.extraction_schema)
    result = structured_llm.invoke(
        [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": "Produce a structured output from these notes.",
            },
        ]
    )
    print("Schema fields extracted successfully.")
    return {"info": result}


def reflection(state: OverallState) -> dict[str, Any]:
    """Reflect on the extracted information and generate search queries to find missing information."""
    print("Performing reflection on extracted information.")

    structured_llm = claude_3_5_sonnet.with_structured_output(ReflectionOutput)

    # Format reflection prompt
    system_prompt = REFLECTION_PROMPT.format(
        schema=json.dumps(state.extraction_schema, indent=2),
        info=state.info,
    )

    print(f"Reflection prompt: {system_prompt}")

    # Invoke
    result = cast(
        ReflectionOutput,
        structured_llm.invoke(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Produce a structured reflection output."},
            ]
        ),
    )

    if result.is_satisfactory:
        print("Reflection determined the results are satisfactory.")
        return {"is_satisfactory": result.is_satisfactory}
    else:
        print("Reflection identified missing fields and generated additional queries.")
        return {
            "is_satisfactory": result.is_satisfactory,
            "search_queries": result.search_queries,
            "reflection_steps_taken": state.reflection_steps_taken + 1,
        }


def route_from_reflection(
    state: OverallState, config: RunnableConfig
) -> Literal[END, "research_company"]:  # type: ignore
    """Route the graph based on the reflection output."""
    print("Routing from reflection output.")

    # Get configuration
    configurable = Configuration.from_runnable_config(config)

    # If we have satisfactory results, end the process
    if state.is_satisfactory:
        print("Ending process as results are satisfactory.")
        return END

    # If results aren't satisfactory but we haven't hit max steps, continue research
    if state.reflection_steps_taken <= configurable.max_reflection_steps:
        print("Continuing research as reflection steps are within limit.")
        return "research_company"

    # If we've exceeded max steps, end even if not satisfactory
    print("Ending process as maximum reflection steps are reached.")
    return END


# Add nodes and edges
print("Building the state graph.")
builder = StateGraph(
    OverallState,
    input=InputState,
    output=OutputState,
    config_schema=Configuration,
)
builder.add_node("gather_notes_extract_schema", gather_notes_extract_schema)
builder.add_node("generate_queries", generate_queries)
builder.add_node("research_company", research_company)
builder.add_node("reflection", reflection)

builder.add_edge(START, "generate_queries")
builder.add_edge("generate_queries", "research_company")
builder.add_edge("research_company", "gather_notes_extract_schema")
builder.add_edge("gather_notes_extract_schema", "reflection")
builder.add_conditional_edges("reflection", route_from_reflection)

# Compile
print("Compiling the state graph.")
graph = builder.compile()
print("State graph compiled successfully.")
