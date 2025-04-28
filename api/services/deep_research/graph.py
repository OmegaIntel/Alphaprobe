from langgraph.graph import StateGraph, START, END
from services.deep_research.state import ReportState, SectionState
from services.deep_research.outline import node_generate_outline
from services.deep_research.process_section import node_process_section
from services.deep_research.compile_final import node_compile_final

# =============================================================================
# MAIN REPORT GRAPH
# =============================================================================

print("[DEBUG] Building main report graph")
report_graph = StateGraph(state_schema=ReportState)

# Build main graph
report_graph.add_node("gen_outline", node_generate_outline)
report_graph.add_node("init_sections", lambda state: setattr(state, "current_section_idx", 0) or state)
report_graph.add_node("process_section", node_process_section)
report_graph.add_node("compile_final", node_compile_final)

report_graph.add_edge(START, "gen_outline")
report_graph.add_edge("gen_outline", "init_sections")
report_graph.add_edge("init_sections", "process_section")

def should_continue(state: ReportState):
    print(f"[DEBUG] Checking continuation: current index {state.current_section_idx} vs total sections {len(state.outline)}")
    if state.current_section_idx < len(state.outline):
        return "process_section"
    return "compile_final"

report_graph.add_conditional_edges(
    "process_section",
    should_continue
)

report_graph.add_edge("compile_final", END)
report_graph_compiled = report_graph.compile()
print("[DEBUG] Report graph compiled")
