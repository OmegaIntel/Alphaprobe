import logging
from api.services.deep_research.stats import ReportState

# Configure logger
logger = logging.getLogger(__name__)


def node_compile_final(state: ReportState) -> ReportState:
    """Compile all sections into a single markdown report."""
    logger.debug("Entering node_compile_final with %d sections", len(state.outline))
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
