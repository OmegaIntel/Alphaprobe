import logging
from services.deep_research.stats import ReportState, SectionState

# Configure logger
logger = logging.getLogger(__name__)


async def node_generate_outline(state: ReportState) -> ReportState:
    """
    Generate a fixed outline for the report based on the topic.
    """
    logger.debug("Using fixed report outline for topic: %s", state.topic)

    # Define your fixed outline here as (title, description) pairs
    fixed_outline = [
        ("Executive Summary", "Concise overview of key findings and recommendations."),
        (
            "Market Overview",
            "Definition, scope, value chain, and high-level industry dynamics.",
        ),
        (
            "Market Size & Growth",
            "Historical, current, and projected market size and growth rates.",
        ),
        (
            "Segmentation Analysis",
            "Breakdown of the market by major segments with their sizes.",
        ),
        ("Competitive Landscape", "Key competitors, market share, and positioning."),
        (
            "Customer Insights",
            "Profiles, needs, and buying behavior of major customer segments.",
        ),
        ("Financial Performance", "Summary of recent financial metrics and trends."),
        (
            "Valuation & Forecast",
            "Valuation approaches, multiples, and forward projections.",
        ),
        ("Risks & Mitigants", "Principal risks and strategies to manage them."),
        ("Conclusions & Next Steps", "Key takeaways and recommended actions."),
    ]

    # Clear any existing outline
    state.outline.clear()

    # Build and append SectionState objects
    for title, description in fixed_outline:
        section = SectionState(
            title=title,
            description=description,
            content="",  # Will be populated later
            report_state=state,
            web_research=state.web_research,
            excel_search=state.config.excel_search,
            kb_search=state.config.file_search,
            report_type=state.report_type,
        )
        state.outline.append(section)
        logger.debug("Added fixed section: %s", title)

    logger.debug("Finished fixed outline with %d sections.", len(state.outline))
    return state
