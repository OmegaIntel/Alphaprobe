import logging
from api.services.deep_research.stats import ReportState

# Configure logger
logger = logging.getLogger(__name__)


def node_compile_final(state: ReportState) -> ReportState:
    """Compile all sections into a single markdown report, or just the updated section in update‐mode."""
    logger.debug("Entering node_compile_final with %d sections", len(state.outline))

    # # ——— UPDATE‐MODE: only emit the one updated section ———
    # if getattr(state, "update_query", None):
    #     idx = state.update_section_index
    #     # guard against missing index
    #     if idx is None or idx < 0 or idx >= len(state.outline):
    #         logger.warning(
    #             "Compile‐final: update_query present but update_section_index=%r invalid; falling back to full‐build",
    #             idx,
    #         )
    #     else:
    #         sec = state.outline[idx]
    #         logger.debug("Update‐mode compile for section %d: %s", idx, sec.title)
    #         header = f"## {idx+1}. {sec.title}\n"
    #         content = sec.content.strip() or "*No content generated.*"
    #         state.final_report = f"{header}\n{content}\n"
    #         return state
    # ——— FULL‐BUILD: compile all sections into a single report ———
    report_lines = []
    for idx, section in enumerate(state.outline, start=1):
        logger.debug("Adding section %d: %s", idx, section.title)
        header = f"## {idx}. {section.title}\n"
        content = (
            section.content.strip() if section.content else "*No content generated.*"
        )
        report_lines.append(f"{header}\n{content}\n")

    state.final_report = "\n".join(report_lines)
    logger.debug(
        "Final report compiled successfully (length: %d chars)", len(state.final_report)
    )
    return state
