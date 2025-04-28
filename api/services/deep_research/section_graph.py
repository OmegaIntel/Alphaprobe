from langgraph.graph import StateGraph, START, END
from services.deep_research.state import ReportState, SectionState, SectionContent
from typing import Dict, List, TypedDict, Any, Optional, Tuple, Annotated, Union
import asyncio
from langchain_core.messages import SystemMessage, HumanMessage
from pydantic import BaseModel, Field, create_model
from services.deep_research.prompts import report_planner_instructions, query_prompt_for_iteration
from services.deep_research.llm import gpt_4

#from services.deep_research.process_section import parallel_excel_search, parallel_web_search, parallel_kb_query



import tiktoken
ENC = tiktoken.encoding_for_model("gpt-4o-mini")
MAX_TOKENS = 40000
def trim_to_tokens(text: str, max_tokens: int = MAX_TOKENS) -> str:
    tokens = ENC.encode(text)
    if len(tokens) <= max_tokens:
        return text
    # Keep the first N tokens and decode back
    return ENC.decode(tokens[:max_tokens])




def determine_section_queries(state: SectionState) -> SectionState:
        """
        Generate targeted queries for all enabled data sources.
        """
        print(f"[DEBUG] Entering determine_section_queries for section: {state.title}")
        print(f"CONFIG: Web={state.web_research}, KB={state.kb_search}, Excel={state.excel_search}")
        # Debug current search settings
        print(f"[DEBUG] Current search settings - Web: {state.web_research}, KB: {state.kb_search}, Excel: {state.excel_search}")
        
        # Build dynamic model fields
        fields = {}
        if state.web_research:
            fields["web_queries"] = (List[str], Field(default_factory=list, description="Web search queries"))
        if state.kb_search:
            fields["kb_queries"] = (List[str], Field(default_factory=list, description="Knowledge base queries"))
        if state.excel_search:
            fields["excel_queries"] = (List[str], Field(default_factory=list, description="Excel data queries"))

        if not fields:
            print(f"[DEBUG] No search enabled for section: {state.title}")
            return state

        # Create model with explicit field descriptions
        DynamicQueries = create_model("DynamicQueries", **fields)

        print(f"Dynamic model fields: {DynamicQueries.model_computed_fields}")
        # Build enhanced prompt
        prompt_template = query_prompt_for_iteration[state.report_type]
        
        # Create source-specific instructions
        source_instructions = []
        if state.web_research:
            source_instructions.append("WEB RESEARCH: Find recent market data, trends, and competitive intelligence")
        if state.kb_search:
            source_instructions.append("KNOWLEDGE BASE: Search internal documents, reports, and proprietary research")
        if state.excel_search:
            source_instructions.append("EXCEL DATA: Query financial spreadsheets for metrics, ratios, and historical data")
        
        enhanced_instruction = (
            "\nGENERATE QUERIES FOR:\n" + "\n".join(f"- {s}" for s in source_instructions) +
            "\nFORMAT: Return exactly 10 as given in the GENERATE QUERIES instruction."
        )
        
        formatted_prompt = prompt_template.format(
            section_title=state.title,
            description=state.description,
            previous_queries="\n".join([f"- {q}" for q in (state.web_queries + state.kb_queries + state.excel_queries)]),
            previous_responses=state.content if state.content else "No responses yet",
            feedback=state.feedback if hasattr(state, 'feedback') else "No specific feedback yet",
            tags=report_planner_instructions[state.report_type].split("Tags to incorporate:")[1].split("\n")[0].strip()
        ) + enhanced_instruction
        
        print(f"[DEBUG] Full prompt:\n{formatted_prompt}")
        
        # Create structured LLM caller
        structured_llm = gpt_4.with_structured_output(
            DynamicQueries,
            method="function_calling",
            include_raw=False
        )
        
        try:
            queries_obj = structured_llm.invoke([
                SystemMessage(content="You are an expert research analyst. Generate precise queries for ALL enabled data sources."),
                HumanMessage(content=trim_to_tokens(formatted_prompt))
            ])
            print(f"[DEBUG] Received queries object: {queries_obj}")
            
            # Process all enabled query types
            if state.web_research:
                state.web_queries.extend(getattr(queries_obj, "web_queries", []))[:5]
                print(f"[DEBUG] Added {len(state.web_queries)} web queries")
            
            if state.kb_search:
                state.kb_queries.extend(getattr(queries_obj, "kb_queries", []))[:5]
                print(f"[DEBUG] Added {len(state.kb_queries)} KB queries")
            
            if state.excel_search:
                state.excel_queries.extend(getattr(queries_obj, "excel_queries", []))[:5]
                print(f"[DEBUG] Added {len(state.excel_queries)} Excel queries")
                
        except Exception as e:
            print(f"[ERROR] Query generation failed: {str(e)}")
            # Fallback queries with more specific examples
            if state.web_research:
                state.web_queries.extend([
                    f"Latest financial performance metrics for {state.title}",
                    f"Current market trends affecting {state.title}",
                    f"Competitive analysis of {state.title} vs industry peers",
                    f"Regulatory changes impacting {state.title}",
                    f"Recent news and developments about {state.title}"
                ])
            
            if state.kb_search:
                state.kb_queries.extend([
                    f"Internal reports on {state.title} financials",
                    f"Proprietary research about {state.title} market position",
                    f"Historical performance data for {state.title}",
                    f"Analyst assessments of {state.title} business model",
                    f"Strategic documents mentioning {state.title}"
                ])
            
            if state.excel_search:
                state.excel_queries.extend([
                    f"{state.title} revenue by product line last 5 years",
                    f"{state.title} quarterly EBITDA margins",
                    f"{state.title} working capital ratios historical data",
                    f"{state.title} capex vs opex breakdown",
                    f"{state.title} regional sales performance"
                ])
        
        print(f"[DEBUG] Final queries - Web: {state.web_queries}, KB: {state.kb_queries}, Excel: {state.excel_queries}")
        return state


def create_section_subgraph():
    section_subgraph = StateGraph(state_schema=SectionState)
    print("[DEBUG] Building section subgraph")
    # =============================================================================
    # SUB-GRAPH NODES
    # =============================================================================
    
    def node_section_data_needs(state: SectionState):
        """Determine what data this specific section needs"""
        print(f"[DEBUG] Entering node_section_data_needs for section: {state.title}")
        determine_section_queries(state)
        print(f"[DEBUG] Exiting node_section_data_needs for section: {state.title}")
        return state

    async def node_parallel_search(state: SectionState) -> SectionState:
        from services.deep_research.process_section import parallel_excel_search, parallel_web_search, parallel_kb_query
        """Launch all searches concurrently"""      
        tasks = []
        if state.excel_queries:
            tasks.append(parallel_excel_search(state.report_state, state.excel_queries))
        if state.web_queries:
            tasks.append(parallel_web_search(state.report_state, state.web_queries))
        if state.kb_queries:
            tasks.append(parallel_kb_query(state.report_state, state.kb_queries))

        results = await asyncio.gather(*tasks, return_exceptions=True)
        for res in results:
            if not isinstance(res, Exception):
                state.citations.extend(res.citations)
                state.context.append(res.context_text)
        return state


    def node_merge_section_data(state: SectionState) -> SectionState:
        """Bulletproof merge handling all possible input formats"""
        print(f"[DEBUG] Entered node merge section for section {state.title}")
        
        def ensure_list(item: Any) -> List:
            if item is None:
                return []
            if isinstance(item, list):
                return item
            return [item]
        
        # Normalize all inputs to lists
        excel_results = ensure_list(state.excel_results)
        web_results = ensure_list(state.web_results)
        kb_results = ensure_list(state.kb_results)
        context = ensure_list(state.context)
        
        # Process context - flatten nested lists
        flat_context = []
        for item in context:
            if isinstance(item, list):
                flat_context.extend([x for x in item if isinstance(x, str)])
            elif isinstance(item, str):
                flat_context.append(item)
        
        # Instead of only pulling from result lists, start with existing state.citations.
        all_citations = list(state.citations)
        for result in excel_results + web_results + kb_results:
            if hasattr(result, 'citations'):
                all_citations.extend(result.citations)
        
        # Process content similarly
        content_parts = []
        for result in excel_results + web_results + kb_results:
            if hasattr(result, 'context_text'):
                content_parts.append(result.context_text)
        
        # Update state
        state.context = "\n\n---\n\n".join(flat_context)
        state.citations = all_citations
        state.content = "\n\n".join(content_parts)
        print(f"[DEBUG] Exiting node_merge_section_data for section {state.title}")
        return state

     # New version with concurrent execution:
    
    section_subgraph.add_node("data_needs", node_section_data_needs)
    section_subgraph.add_node("parallel_search", node_parallel_search)
    section_subgraph.add_node("merge_data", node_merge_section_data)

    # Update the edges:
    section_subgraph.add_edge(START, "data_needs")
    # After determining queries, launch all searches concurrently:
    section_subgraph.add_edge("data_needs", "parallel_search")
    # Merge the results after the concurrent searches complete:
    section_subgraph.add_edge("parallel_search", "merge_data")
    section_subgraph.add_edge("merge_data", END)

    print("[DEBUG] Section subgraph compiled")
    return section_subgraph.compile()

section_subgraph_compiled = create_section_subgraph()








    


   
   


