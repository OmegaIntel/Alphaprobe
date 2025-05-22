import logging

from api.services.update_flow.graph_update import update_graph_compiled
from api.services.update_flow.schema import ReportState, UpdateGraphState, SectionState

logger = logging.getLogger(__name__)

async def run_update_graph(state: ReportState, update_query: str) -> ReportState:
    init = UpdateGraphState(query=update_query, report=state)
    final = await update_graph_compiled.ainvoke(
        init,
        config={ "configurable": {"thread_id": state.project_id,
                                  "user_id": state.user_id} }
    )
    final_state = UpdateGraphState(**final) 
    return final_state.report
