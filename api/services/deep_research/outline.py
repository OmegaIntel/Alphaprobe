from services.deep_research.state import ReportState, SectionState
from services.deep_research.llm import gpt_4
from services.deep_research.config import Configuration
from services.deep_research.prompts import report_planner_instructions, report_planner_query_writer_instructions
from services.utils.pdf_parser import extract_pdf_from_s3, parse_pdf_structure


from services.deep_research.prompts import (
    report_planner_query_writer_instructions,
    report_planner_instructions,
    section_writer_instructions,
    final_section_writer_instructions,
    query_prompt_for_iteration,
)



"""
async def node_generate_outline(state: ReportState):
   #Generate report outline from PDF in S3 using structured LLM calls.
    
    #If PDF sections are found, use them directly to create the outline without further KB or web searches.
    #Otherwise, perform KB search and LLM outline generation.
    
    print(f"[DEBUG] Entering node_generate_outline for topic: {state.topic}")

    # 1. Download and parse PDF from S3.
    pdf_text = await extract_pdf_from_s3(state.user_id, state.project_id)
    print(f"[DEBUG] PDF text length: {len(pdf_text) if pdf_text else 0}")
    
    pdf_sections = []
    if pdf_text:
        pdf_sections = parse_pdf_structure(pdf_text)
        print(f"[DEBUG] Parsed {len(pdf_sections)} PDF sections")
    else:
        default = await extract_pdf_from_s3("default", "outline")
        if default:
            pdf_sections = parse_pdf_structure(default)
            print(f"[DEBUG] Parsed {len(pdf_sections)} PDF sections")

    # ---------------------------------------
    # CASE 1: PDF sections exist – use them as-is.
    # ---------------------------------------
    if pdf_sections:
        print("[DEBUG] PDF sections found. Using them directly to create outline without KB or web search.")
        for sec in pdf_sections:
            title = sec.get("title", "Untitled Section")
            content = sec.get("content", "")
            # Use the first 200 characters as a brief description (if desired)
            description = content[:200] if content else ""
            new_section_state = SectionState(
                title=title,
                description=description,
                content=content,
                report_state=state,
                # Maintain original configuration values
                web_research=state.config.web_search if hasattr(state.config, "web_search") else False,
                excel_search=state.config.file_search if hasattr(state.config, "file_search") else False,
                kb_search=state.config.file_search if hasattr(state.config, "file_search") else False,
                report_type=state.report_type
            )
            state.outline.append(new_section_state)
            print(f"[DEBUG] Created outline section from PDF: {new_section_state.title} (Total sections: {len(state.outline)})")
        print(f"[DEBUG] Exiting node_generate_outline with {len(state.outline)} sections created from PDF.")
        return state

    # ---------------------------------------
    # CASE 2: No PDF sections – perform KB search and generate outline via LLM.
    # ---------------------------------------
    print("[DEBUG] No PDF sections found. Proceeding with KB search and LLM outline generation.")
    
    # Generate queries (structured response) to find content using KB search.
    structured_llm_queries = gpt_4.with_structured_output(Queries, method="function_calling" )
    system_prompt_for_queries = report_planner_query_writer_instructions[state.report_type].format(topic=state.topic)
    print(f"[DEBUG] System prompt for queries prepared")
    
    queries_obj = structured_llm_queries.invoke([
        SystemMessage(content=trim_to_tokens(system_prompt_for_queries)),
        HumanMessage(content="Generate a list of doc queries in JSON under 'queries'.")
    ])
    print(f"[DEBUG] Generated queries: {queries_obj.queries}")

    # Query the local documents (KB search) for each generated query.
    doc_context_list = []
    for q in queries_obj.queries:
        print(f"[DEBUG] Querying KB with query: {q.search_query}")
        resp = query_kb(q.search_query, KNOWLEDGE_BASE_ID, state.user_id, state.project_id, MODEL_ARN)
        output_text = resp.get('output', {}).get('text', 'No results found')
        doc_text = f"Query: {q.search_query}\nResult: {output_text}\n"
        doc_context_list.append(doc_text)
    combined_context = "\n".join(doc_context_list)
    print(f"[DEBUG] Combined context from KB queries generated")

    # Since no PDF sections, prepare an empty prompt for PDF sections text.
    pdf_sections_text = ""
    print(f"[DEBUG] No PDF sections text prepared (empty)")

    # Create sections from context using LLM.
    structured_llm_sections = gpt_4.with_structured_output(Sections, method="function_calling" )
    outline_prompt = report_planner_instructions[state.report_type].format(
        topic=state.topic,
        context=combined_context,
        pdf_sections=pdf_sections_text
    )
    print(f"[DEBUG] Outline prompt prepared: {outline_prompt[:200]}...")

    sections_obj = structured_llm_sections.invoke([
        SystemMessage(content=trim_to_tokens(outline_prompt)),
        HumanMessage(content="Generate the JSON array of sections under 'sections'.")
    ])
    print(f"[DEBUG] Sections generated by LLM")

    # Validate outline against PDF sections. Here, pdf_sections is empty, so the validator should handle it gracefully.
    sections_obj.sections = validate_outline_against_pdf(
        sections_obj.sections,
        pdf_sections
    )
    print(f"[DEBUG] Outline after validation has {len(sections_obj.sections)} sections")

    # Convert the generated sections into SectionState objects.
    for section in sections_obj.sections:
        # Since there are no PDF sections, we set content as empty.
        new_section_state = SectionState(
            title=section.name,
            description=section.description,
            content="",
            report_state=state,
            web_research=state.config.web_search if hasattr(state.config, "web_search") else False,
            excel_search=state.config.excel_search if hasattr(state.config, "excel_search") else False,
            kb_search=state.config.file_search if hasattr(state.config, "file_search") else False,
            report_type=state.report_type
        )
        state.outline.append(new_section_state)
        print(f"[DEBUG] Created outline section from LLM: {new_section_state.title} (Total sections: {len(state.outline)})")

    print(f"[DEBUG] Exiting node_generate_outline with {len(state.outline)} sections created (via KB & LLM).")
    return state

"""

# -----------------------------------------------------------------------------
# Replacement: use a fixed outline for report generation
# -----------------------------------------------------------------------------
async def node_generate_outline(state: ReportState):
    """
    Replace dynamic outline generation with a fixed, manually defined outline.
    """
    print(f"[DEBUG] Using fixed report outline for topic: {state.topic}")

    # ----- 1) Define your fixed outline here -----
    # Each tuple is (section_title, section_description)
    fixed_outline = [
        ("Executive Summary", "Concise overview of key findings and recommendations."),
        ("Market Overview", "Definition, scope, value chain, and high-level industry dynamics."),
        ("Market Size & Growth", "Historical, current, and projected market size and growth rates."),
        ("Segmentation Analysis", "Breakdown of the market by major segments with their sizes."),
        ("Competitive Landscape", "Key competitors, market share, and positioning."),
        ("Customer Insights", "Profiles, needs, and buying behavior of major customer segments."),
        ("Financial Performance", "Summary of recent financial metrics and trends."),
        ("Valuation & Forecast", "Valuation approaches, multiples, and forward projections."),
        ("Risks & Mitigants", "Principal risks and strategies to manage them."),
        ("Conclusions & Next Steps", "Key takeaways and recommended actions.")
    ]
    # -----------------------------------------------

    # ----- 2) Clear any existing outline and build new SectionState objects -----
    state.outline.clear()
    for title, description in fixed_outline:
        section = SectionState(
            title=title,
            description=description,
            content="",  # will be filled later
            report_state=state,
            web_research=state.web_research,
            excel_search=state.config.excel_search,
            kb_search=state.config.file_search,
            report_type=state.report_type
        )
        state.outline.append(section)
        print(f"[DEBUG] Added fixed section: {title}")

    print(f"[DEBUG] Finished fixed outline with {len(state.outline)} sections.")
    return state


