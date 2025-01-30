from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from langchain_core.runnables import RunnableConfig
import asyncio
import traceback
import json

# Import the financial report graph
from api.api_sr import financial_report_graph
from config.configuration import Configuration
import dataclasses

# FastAPI app
exp_router = APIRouter()

class FinancialReportRequest(BaseModel):
    topic: str

# Response Model
class ReportResponse(BaseModel):
    final_report: str

async def run_report_generation(config: Configuration, topic: str) -> str:
    print(f"DEBUG: Starting report generation for topic: {topic}")

    # Input to start the graph execution
    report_state_input = {"topic": topic}

    try:
        # Convert Configuration object to dictionary
        config_dict = dataclasses.asdict(config)
        print(f"DEBUG: Config dictionary: {config_dict}")

        # Execute the graph asynchronously
        output = await financial_report_graph.ainvoke(
            input=report_state_input,
            config=config_dict  # Pass the dictionary version
        )

        # Convert the final_report (a dict) to a JSON string
        report_json_str = json.dumps(output["final_report"])
        print("DEBUG: Graph execution completed.")
        print("DEBUG: Final report output (dict) was converted to JSON string.")
        return report_json_str

    except Exception as e:
        print("ERROR: Graph execution failed.")
        traceback.print_exc()
        raise e  # Re-raise the exception to be caught by FastAPI


@exp_router.post("/api/exp_report", response_model=ReportResponse)
async def generate_report(request: FinancialReportRequest, background_tasks: BackgroundTasks):
    print("DEBUG: Received report generation request.")
    try:
        # Create the configuration from the request
        config = Configuration(
            tavily_topic="news",  # or "general"
            tavily_days=30,
            number_of_queries=3
        )
        print("DEBUG: Configuration created successfully.")

        # Run the report asynchronously
        report_str = await run_report_generation(config, request.topic)

        print("DEBUG: Report generation completed successfully.")
        # Return the final report as a JSON string (matches ReportResponse.final_report)
        return {"final_report": report_str}

    except Exception as e:
        print("ERROR: Exception in API endpoint.")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
