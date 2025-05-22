import logging

from langgraph.graph import StateGraph, START, END
from services.deep_research.classes import ReportState
from services.deep_research.graph_nodes import node_generate_outline, node_compile_final, node_check_report_exists, node_generate_update_queries, node_process_section, recognize_section_to_update, init_sections

# Configure module‐level logger
logger = logging.getLogger(__name__)

def should_continue(state: ReportState) -> str:
    """Decide whether to loop back into processing or move to compilation."""
    logger.debug(
        "Continuation check: current_section_idx=%d, total sections=%d",
        state.current_section_idx,
        len(state.outline),
    )
    if state.exists:
        logger.debug(
            "Update query detected, skipping section processing: %s",
            state.update_query,
        )
        return "compile_final"
    if state.current_section_idx < len(state.outline):
        return "process_section"
    return "compile_final"

# -----------------------------------------------------------------------------
logger.debug("Building main report graph")
report_graph = StateGraph(state_schema=ReportState)

# Add nodes
report_graph.add_node("check_exists", node_check_report_exists)
report_graph.add_node("gen_outline", node_generate_outline)
report_graph.add_node("recognize_section", recognize_section_to_update)
report_graph.add_node("generate_update_queries", node_generate_update_queries)
report_graph.add_node("init_sections", init_sections)
report_graph.add_node("process_section", node_process_section)
report_graph.add_node("compile_final", node_compile_final)

# Wire up edges
report_graph.add_edge(START, "check_exists")
report_graph.add_conditional_edges(
    "check_exists",
    lambda state: "recognize_section" if state.exists else "gen_outline"
)

# Update-path:
report_graph.add_edge("recognize_section", "generate_update_queries")
report_graph.add_edge("generate_update_queries", "process_section")

# Full-build path continues (unchanged):
report_graph.add_edge("gen_outline", "init_sections")
report_graph.add_edge("init_sections", "process_section")

# Conditional looping edge
report_graph.add_conditional_edges("process_section", should_continue)

report_graph.add_edge("compile_final", END)

# Compile to executable graph
report_graph_compiled = report_graph.compile()
logger.debug("Report graph compiled")
