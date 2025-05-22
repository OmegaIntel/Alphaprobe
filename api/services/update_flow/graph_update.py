# update_graph.py
import logging

from langgraph.graph import StateGraph, START, END

# ─── application-level models you already have ────────────────────
from api.services.update_flow.schema import UpdateGraphState
from api.services.update_flow.graph_update_nodes import (
    node_parse_updates,
    node_plan_updates,
    node_fetch_sources,
    node_apply_fragments,
    node_update_visuals,
    node_compile_final
)

# ─── build graph ──────────────────────────────────────────────────
logger = logging.getLogger(__name__)
logger.debug("Building incremental-update graph")

update_graph = StateGraph(state_schema=UpdateGraphState)

# register nodes
update_graph.add_node("parse_updates",   node_parse_updates)
update_graph.add_node("plan_updates",    node_plan_updates)
update_graph.add_node("fetch_sources",   node_fetch_sources)
update_graph.add_node("apply_fragments", node_apply_fragments)
update_graph.add_node("update_visuals",  node_update_visuals)
update_graph.add_node("compile_final",   node_compile_final)

# wire edges
update_graph.add_edge(START, "parse_updates")
update_graph.add_edge("parse_updates", "plan_updates")

update_graph.add_conditional_edges(              # need fresh research?
    "plan_updates",
    lambda s: "fetch_sources" if s.need_research else "apply_fragments"
)
update_graph.add_edge("fetch_sources",  "apply_fragments")
update_graph.add_edge("apply_fragments","update_visuals")
update_graph.add_edge("update_visuals", "compile_final")
update_graph.add_edge("compile_final",  END)

# compile
update_graph_compiled = update_graph.compile()
logger.debug("Incremental-update graph compiled")
