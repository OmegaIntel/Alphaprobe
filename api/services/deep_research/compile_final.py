from services.deep_research.state import ReportState


def node_compile_final(state: ReportState):
    """Compile all sections into final report"""
    print(f"[DEBUG] Entering node_compile_final, compiling final report with {len(state.outline)} sections")
    out = []
    for i, sec in enumerate(state.outline, start=1):
        print(f"[DEBUG] Compiling section {i}: {sec.title}")
        out.append(f"## {i}. {sec.title}\n\n{sec.content.strip()}\n")
    state.final_report = "\n".join(out)
    print(f"[DEBUG] Final report compiled")
    return state
