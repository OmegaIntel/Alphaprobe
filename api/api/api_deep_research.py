import os
import uuid
import time
from typing import Any, List

import boto3
import botocore
import requests
from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
from fastapi.responses import JSONResponse
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from llama_index.core.query_engine import BaseQueryEngine

from api.api_user import get_current_user
from api.utils.configuration import Configuration
from api.utils.prompts import *
from api.utils.state import (
    Section,
    Sections,
    Queries,
    ReportStateInput,
    ReportStateOutput,
    ReportState,
    SectionState,
)
from langgraph.constants import Send
from langgraph.graph import START, END, StateGraph

deep_research_router = APIRouter()

s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name="us-east-1",
)

bedrock_client = boto3.client(
    "bedrock",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name="us-east-1",
)

bedrock_runtime = boto3.client(
    "bedrock-agent-runtime",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name="us-east-1",
)

BUCKET_NAME = "deep-research-docs"
KNOWLEDGE_BASE_ID = "ITOY3SGHN2"
DATA_SOURCE_ID = "RIM2FNYUIO"
MODEL_ARN = "amazon.nova-lite-v1:0"
openai_client = ChatOpenAI(
    model="gpt-4o-mini", temperature=0.0, api_key=os.getenv("OPENAI_API_KEY")
)

query_engine: BaseQueryEngine = None


def set_query_engine(engine: BaseQueryEngine):
    global query_engine
    query_engine = engine


async def generate_report_plan(state: ReportState, config: RunnableConfig):
    topic = state["topic"]
    report_type = state["report_type"]

    structured_llm_queries = openai_client.with_structured_output(Queries)
    system_prompt_for_queries = report_planner_query_writer_instructions[report_type].format(topic=topic)

    queries_obj = structured_llm_queries.invoke(
        [
            SystemMessage(content=system_prompt_for_queries),
            HumanMessage(content="Generate a list of doc queries in JSON under 'queries'."),
        ]
    )
    print(f"[DEBUG] Generated queries")

    doc_context_list = []
    if query_engine:
        for q in queries_obj.queries:
            resp = query_engine.query(q.search_query)
            doc_context_list.append(f"Query: {q.search_query}\n{str(resp)}\n")
    combined_context = "\n".join(doc_context_list)

    structured_llm_sections = openai_client.with_structured_output(Sections, method="function_calling")
    system_prompt_for_sections = report_planner_instructions[report_type].format(topic=topic, context=combined_context)

    sections_obj = structured_llm_sections.invoke(
        [
            SystemMessage(content=system_prompt_for_sections),
            HumanMessage(content="Generate the JSON array of sections under 'sections'."),
        ]
    )
    print(f"[DEBUG] Generated report sections")

    return {"sections": sections_obj.sections}


def generate_queries(state: SectionState, config: RunnableConfig):
    section = state["section"]
    report_type = state["report_type"]
    structured_llm_queries = openai_client.with_structured_output(Queries)

    previous_queries = state.get("previous_queries", [])
    previous_text = "\n".join([f"Q: {pq.search_query}" for pq in previous_queries]) if previous_queries else "None"
    previous_section_output = state.get("source_str", "No previous document search results available.")

    prompt = query_prompt_for_iteration[report_type].format(
        description=section.description,
        previous_text=previous_text,
        previous_section_output=previous_section_output,
    )

    queries_obj = structured_llm_queries.invoke(
        [
            SystemMessage(content=prompt),
            HumanMessage(content="Return 'queries' in JSON."),
        ]
    )
    print(f"[DEBUG] Generated specialized queries for section '{section.name}': {queries_obj}")

    previous = state.get("previous_queries", [])
    unique_queries = [q for q in queries_obj.queries if q.search_query not in [pq.search_query for pq in previous]]
    state.setdefault("previous_queries", []).extend(unique_queries)
    return {"search_queries": unique_queries}


def search_document(state: SectionState, config: RunnableConfig):
    search_queries = state["search_queries"]
    user_id = state["user_id"]

    def query_kb(input, kbId, user_id, modelId=None):
        vector_search_config = {"numberOfResults": 5}
        if user_id:
            vector_search_config["filter"] = {"user_id": user_id}

        response = bedrock_runtime.retrieve_and_generate(
            input={"text": input},
            retrieveAndGenerateConfiguration={
                "knowledgeBaseConfiguration": {
                    "generationConfiguration": {
                        "promptTemplate": {"textPromptTemplate": generationPrompt}
                    },
                    "orchestrationConfiguration": {
                        "promptTemplate": {"textPromptTemplate": orchestrationPrompt}
                    },
                    "knowledgeBaseId": kbId,
                    "modelArn": modelId,
                    "retrievalConfiguration": {
                        "vectorSearchConfiguration": vector_search_config
                    },
                },
                "type": "KNOWLEDGE_BASE",
            },
        )

        return response

    results = []
    for sq in search_queries:
        resp = query_kb(sq.search_query, KNOWLEDGE_BASE_ID, user_id, MODEL_ARN)
        doc_text = f"Query: {sq.search_query}\nResult: {resp['output']}\n"

        citation = resp.get("citation")
        if citation:
            cit_text = citation.get("generatedResponsePart", {}).get("textResponsePart", {}).get("text", "")
            references = citation.get("retrievedReferences", [])
            ref_urls = [
                (location.get("webLocation", {}) or location.get("confluenceLocation", {}) or location.get("s3Location", {})).get("url")
                or (location.get("s3Location", {}) or {}).get("uri")
                for ref in references
                if (location := ref.get("location", {}))
            ]
            formatted_refs = ", ".join([f"[Reference]({url})" for url in ref_urls]) if ref_urls else "None"
            citation_str = f"**Citation:** {cit_text} **References:** {formatted_refs}"
            doc_text += citation_str + "\n"

        results.append(doc_text)
    combined = "\n".join(results)
    print(f"[DEBUG] Combined document excerpts for section '{state['section'].name}' with citations.")
    return {"source_str": combined}


def write_section(state: SectionState):
    section = state["section"]
    src = state["source_str"]
    report_type = state["report_type"]

    prompt = section_writer_instructions[report_type].format(
        section_title=section.name, section_topic=section.description, context=src
    )

    response = openai_client.invoke(
        [
            SystemMessage(content=prompt),
            HumanMessage(content="Draft the content for this section."),
        ]
    )
    section.content = response.content
    print(f"[DEBUG] Wrote section '{section.name}'")
    return {"completed_sections": [section]}


async def iterate_section_research(state: SectionState, config: RunnableConfig):
    section_iterations = config.get("section_iterations", 2)
    accumulated_context = ""

    async def tavily_search(query: str) -> Any:
        print(f"[DEBUG] Starting Tavily search for query: {query}")
        api_url = "https://api.tavily.com/search"
        
        headers = {
            "Authorization": f"Bearer {os.getenv('TAVILY_API_KEY')}",
            "Content-Type": "application/json",
        }
        payload = {"query": query, "max_results": 5, "include_raw_content": True}
        results = []
        for attempt in range(3):
            print(f"[DEBUG] Tavily search attempt {attempt+1}")
            try:
                response = requests.post(api_url, json=payload, headers=headers, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    results.extend(
                        {
                            "title": item.get("title", ""),
                            "url": item.get("url", ""),
                            "content": item.get("content", ""),
                        }
                        for item in data.get("results", [])
                    )
                    break
            except Exception as e:
                print(f"[DEBUG] Tavily search attempt {attempt+1} failed with error: {e}")
                if attempt < 2:
                    time.sleep(2)
        print(f"[DEBUG] Tavily search completed with {len(results)} results")
        return results

    for i in range(section_iterations):
        print(f"[DEBUG] Iteration {i+1} for section '{state['section'].name}'")

        queries_result = generate_queries(state, config)
        state["search_queries"] = queries_result["search_queries"]

        doc_result = await search_document(state, config)

        web_result = await tavily_search(state["section"].name)
        web_result_str = "\n".join(
            [f"Title: {r['title']}\nURL: {r['url']}\nContent: {r['content']}" for r in web_result]
        ) if isinstance(web_result, list) else str(web_result)

        combined_iteration = (
            f"--- Iteration {i+1} ---\n"
            f"Document Results:\n{doc_result['source_str']}\n\n"
            f"Web Results:\n{web_result_str}\n"
        )

        print(f"[DEBUG] The combined answers for the queries for this section's Iteration {i} are:\n{combined_iteration}\n")
        accumulated_context += combined_iteration + "\n"

    state["source_str"] = accumulated_context
    final_output = write_section(state)
    return final_output


def format_sections(sections: List[Section]) -> str:
    out = []
    for idx, sec in enumerate(sections, 1):
        out.append(
            f"""
============================================================
Section {idx}: {sec.name}
============================================================
Description:
{sec.description}
Needs Research: {sec.research}

Content:
{sec.content if sec.content else '[Not yet written]'}
"""
        )
    return "\n".join(out)


def gather_completed_sections(state: ReportState):
    completed_sections = state.get("completed_sections", [])
    joined = format_sections(completed_sections)
    print(f"[DEBUG] Gathered completed sections")
    return {"report_sections_from_research": joined}


def write_final_sections(state: SectionState):
    section = state["section"]
    report_type = state["report_type"]
    prompt = final_section_writer_instructions[report_type].format(
        context=state["report_sections_from_research"]
    )
    response = openai_client.invoke(
        [
            SystemMessage(content=f"Generate the final text for {section.name}: {section.description}"),
            HumanMessage(content=prompt),
        ]
    )
    section.content = response.content
    print(f"[DEBUG] Finalized section '{section.name}' without additional doc research")
    return {"completed_sections": [section]}


def compile_final_report(state: ReportState):
    sections = state["sections"]
    completed_map = {s.name: s.content for s in state.get("completed_sections", [])}
    for s in sections:
        if s.name in completed_map:
            s.content = completed_map[s.name]
    final_report_text = "\n\n".join([sec.content for sec in sections])
    print(f"[DEBUG] Compiled final report")
    return {"final_report": final_report_text}


builder = StateGraph(
    ReportState,
    input=ReportStateInput,
    output=ReportStateOutput,
    config_schema=Configuration,
)

builder.add_edge(START, "generate_report_plan")
builder.add_node("generate_report_plan", generate_report_plan)

builder.add_node("iterate_section_research", iterate_section_research)


def initiate_section_writing(state: ReportState):
    return [
        Send(
            "iterate_section_research",
            {"section": s, "report_type": state["report_type"]},
        )
        for s in state["sections"]
        if s.research
    ]


builder.add_conditional_edges(
    "generate_report_plan", initiate_section_writing, ["iterate_section_research"]
)

builder.add_node("gather_completed_sections", gather_completed_sections)
builder.add_edge("iterate_section_research", "gather_completed_sections")

builder.add_node("write_final_sections", write_final_sections)


def initiate_final_section_writing(state: ReportState):
    return [
        Send(
            "write_final_sections",
            {
                "section": s,
                "report_type": state["report_type"],
                "report_sections_from_research": state["report_sections_from_research"],
            },
        )
        for s in state["sections"]
        if not s.research
    ]


builder.add_conditional_edges(
    "gather_completed_sections",
    initiate_final_section_writing,
    ["write_final_sections"],
)
builder.add_edge("write_final_sections", "compile_final_report")
builder.add_node("compile_final_report", compile_final_report)
builder.add_edge("compile_final_report", END)

doc_search_graph = builder.compile()


@deep_research_router.post("/api/deep-research")
async def deep_research(
    user_query: str,
    report_type: int,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    user_id = current_user.id
    s3_file_path = f"{user_id}/{file.filename}"
    try:
        s3_client.upload_fileobj(
            file.file,
            BUCKET_NAME,
            s3_file_path,
            ExtraArgs={"ACL": "public-read", "Metadata": {"user_id": str(user_id)}},
        )
    except botocore.exceptions.ClientError as e:
        raise HTTPException(status_code=400, detail=f"Error uploading file: {str(e)}")

    try:
        bedrock_client.start_ingestion_job(
            knowledgeBaseId=KNOWLEDGE_BASE_ID,
            dataSourceId=DATA_SOURCE_ID,
            clientToken=str(uuid.uuid4()),
        )
    except botocore.exceptions.ClientError:
        print("Ingestion job start failed for s3_file_path:", s3_file_path)

    print(f"File uploaded successfully: {s3_file_path}")

    user_input = {
        "topic": user_query,
        "user_id": user_id,
        "file_path": s3_file_path,
        "report_type": report_type,
    }

    result = await doc_search_graph.ainvoke(user_input)

    if result is None:
        print("[ERROR] The state graph returned None. Check the graph flow and node return values.")
        raise HTTPException(status_code=500, detail="Internal server error")
    else:
        final_report = result.get("final_report", "")
        output_file = "final_report.txt"
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(final_report)
        return JSONResponse(content={"final_report": final_report}, status_code=200)
        