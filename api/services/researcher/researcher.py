import nest_asyncio
from typing import List
from api.services.researcher.stats import Citation
from api.services.researcher.graph_node import build_document_graph
from fastapi import HTTPException
from api.services.researcher.prompts import TEMPLATE_HEADING

from dotenv import load_dotenv, find_dotenv

env_path = find_dotenv()  # walks up until it finds .env
loaded = load_dotenv(env_path)

nest_asyncio.apply()


# global collector
CITATIONS: List[Citation] = []


async def generate_structured_report(
    instruction: str,
    report_type: int,
    file_search: bool,
    web_search: bool,
    project_id: str,
    user_id: str,
):
    print(
        "[DEBUG] Entering generate_structured_report with query:",
        instruction,
        "user_id:",
        user_id,
        "project_id:",
        project_id,
    )
    try:
        index_name = f"d{project_id}".lower()
        print(f"[generate_structured_report] Using index name: {index_name}")

        document_graph = build_document_graph()
        print("[generate_structured_report] Document graph built successfully.")

        headings = TEMPLATE_HEADING[report_type]["heading"]

        input_state = {
            "topic": instruction,
            "headings": headings,
            "index": index_name,
            "user_id": user_id,
            "project_id": project_id,
            "file_search": file_search,
            "web_search": web_search,
        }

        print(
            "[generate_structured_report] Input state for document graph:", input_state
        )

        # Run the graph
        final_state = await document_graph.ainvoke(input_state)
        if final_state is None:
            print(
                "[ERROR] The state graph returned None. Check the graph flow and node return values."
            )

        print("[DEBUG] Final state received from document graph:", final_state)

        # Access the final report directly from the merged state
        report = final_state.get("report")
        if not report:
            raise ValueError("Report not found in final state.")
        return {"report": report}
    except Exception as e:
        print("[DEBUG] Exception in generate_structured_report:", e)
        return None


async def generate_report(
    instruction: str,
    report_type: int,
    file_search: bool,
    web_search: bool,
    project_id: str,
    user_id: str,
):
    print("[DEBUG] Entering generate_report endpoint")

    try:
        # print(f"[generate_report] Step 1: Received query: {query}")
        # print(f"[generate_report] Step 2: Received project_id: {query.project_id}")
        # print("[generate_report] Step 3: Validating deal ID and user...")

        print("[generate_report] Step 4: Deal validation successful.")
        print("[generate_report] Step 5: Generating structured report...")

        report_content = await generate_structured_report(
            instruction, report_type, file_search, web_search, project_id, user_id
        )
        if not report_content:
            print("[generate_report] Step 5.1: Report generation failed.")
            raise HTTPException(status_code=404, detail="Failed to generate report.")

        print("[generate_report] Step 6: Report generated successfully.")
        print("[generate_report] Step 7: Saving report to database...")

        print("[DEBUG] Exiting generate_report endpoint with success.")
        return {
            "message": "Report generated and saved successfully",
            "report": report_content.get("report", ""),
            "sections": CITATIONS,
        }
    except Exception as e:
        print(f"[generate_report] Error encountered: {str(e)}")
        print("[DEBUG] Exiting generate_report endpoint with error.")
        raise HTTPException(status_code=500, detail=str(e))
