# services/deep_research/graph.py

# =============================================================================
import logging

from langgraph.graph import StateGraph, START, END
from services.deep_research.state import ReportState
from services.deep_research.outline import node_generate_outline
from services.deep_research.process_section import node_process_section
from services.deep_research.compile_final import node_compile_final

# Configure module‐level logger
logger = logging.getLogger(__name__)

def init_sections(state: ReportState) -> ReportState:
    """Initialize section index to zero."""
    state.current_section_idx = 0
    return state

def should_continue(state: ReportState) -> str:
    """Decide whether to loop back into processing or move to compilation."""
    logger.debug(
        "Continuation check: current_section_idx=%d, total sections=%d",
        state.current_section_idx,
        len(state.outline)
    )
    if state.current_section_idx < len(state.outline):
        return "process_section"
    return "compile_final"

# -----------------------------------------------------------------------------
logger.debug("Building main report graph")
report_graph = StateGraph(state_schema=ReportState)

# Add nodes
report_graph.add_node("gen_outline", node_generate_outline)
report_graph.add_node("init_sections", init_sections)
report_graph.add_node("process_section", node_process_section)
report_graph.add_node("compile_final", node_compile_final)

# Wire up edges
report_graph.add_edge(START, "gen_outline")
report_graph.add_edge("gen_outline", "init_sections")
report_graph.add_edge("init_sections", "process_section")

# Conditional looping edge
report_graph.add_conditional_edges("process_section", should_continue)

report_graph.add_edge("compile_final", END)

# Compile to executable graph
report_graph_compiled = report_graph.compile()
logger.debug("Report graph compiled")
