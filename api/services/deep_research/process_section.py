
from services.deep_research.state import SectionContent
from services.utils.excel_utils import extract_excel_index
from langgraph.graph import START, END, StateGraph
from services.deep_research.state import ReportState, SectionState, SectionContent
from typing import Dict, List, TypedDict, Any, Optional, Tuple, Annotated, Union
from services.deep_research.state import ReportState, SectionState
from services.deep_research.llm import gpt_4
from langchain_core.messages import SystemMessage, HumanMessage
from services.deep_research.state import SearchResult, Citation, KBCitation, WebCitation, ExcelCitation
import asyncio
from services.utils.websearch_utils import call_tavily_api
from services.utils.kb_search import query_kb, get_presigned_url_from_source_uri
from pydantic import BaseModel, Field
import re, os

import tiktoken
ENC = tiktoken.encoding_for_model("gpt-4o-mini")
MAX_TOKENS = 40000
def trim_to_tokens(text: str, max_tokens: int = MAX_TOKENS) -> str:
    tokens = ENC.encode(text)
    if len(tokens) <= max_tokens:
        return text
    # Keep the first N tokens and decode back
    return ENC.decode(tokens[:max_tokens])




KNOWLEDGE_BASE_ID = os.getenv("KNOWLEDGE_BASE_ID", "my-knowledge-base")
MODEL_ARN = os.getenv("MODEL_ARN", "arn:aws:bedrock:my-model")


async def node_process_section(state: ReportState):
        print(f"[DEBUG] Processing section index: {state.current_section_idx}")
        
        # Get current section
        current_section = state.outline[state.current_section_idx]
        
        # Initialize section state
        section_state = SectionState(
            title=current_section.title,
            web_research=state.web_research,
            excel_search=state.config.excel_search,
            kb_search=state.file_search,
            report_type=state.report_type,
            description=current_section.description,
            report_state=state
        )
        from services.deep_research.section_graph import section_subgraph_compiled
        # Process section
        processed_data = await section_subgraph_compiled.ainvoke(section_state)
        
        # Convert back to SectionState if needed
        if isinstance(processed_data, dict):
            processed_state = convert_to_section_state(state, processed_data)
        else:
            processed_state = processed_data
        
        # Generate content
        await generate_section_content(state, processed_state)
        
        # Retry logic
        for attempt in range(state.config.section_iterations):
            success, feedback = evaluate_section(current_section)
            if success:
                break
                
            print(f"[RETRY] Researching section (Attempt {attempt+1})")
            processed_data = await section_subgraph_compiled.ainvoke(processed_state)
            if isinstance(processed_data, dict):
                processed_state = convert_to_section_state(state, processed_data)
            await generate_section_content(state, processed_state)
        
        # Update state
        state.current_section_idx += 1
        return state


def convert_to_section_state(base_state: ReportState, data: dict) -> SectionState:
    """Convert dictionary to SectionState with all required fields"""
    return SectionState(
        title=data.get('title', base_state.outline[base_state.current_section_idx].title),
        web_research=data.get('web_research', base_state.web_research),
        excel_search=data.get('excel_search', base_state.config.excel_search),
        kb_search=data.get('kb_search', base_state.file_search),
        report_type=data.get('report_type', base_state.report_type),
        # Optional fields
        description=data.get('description', ''),
        web_results=data.get('web_results', []),
        excel_results=data.get('excel_results', []),
        kb_results=data.get('kb_results', []),
        citations=data.get('citations', []),
        context=data.get('context', []),
        content=data.get('content', ''),
        report_state=base_state,
        queries=data.get('queries', []),
        attempts=data.get('attempts', 0),
        excel_queries=data.get('excel_queries', []),
        web_queries=data.get('web_queries', []),
        kb_queries=data.get('kb_queries', [])
    )


async def generate_section_content(state: ReportState, section_state: Union[SectionState, dict]) -> SectionState:
        """Generate structured section content using collected research data"""
        print("[DEBUG] Entering Generate Section Content")
        
        # Convert dict-like input to proper SectionState
        if isinstance(section_state, dict):
            section_state = SectionState(
                title=section_state.get('title'),
                web_research=section_state.get('web_research'),
                excel_search=section_state.get('excel_search'),
                kb_search=section_state.get('kb_search'),
                report_type=section_state.get('report_type'),
                description=section_state.get('description', ''),
                web_results=section_state.get('web_results'),
                excel_results=section_state.get('excel_results'),
                kb_results=section_state.get('kb_results'),
                citations=section_state.get('citations', []),
                context=section_state.get('context', ''),
                content=section_state.get('content', ''),
                report_state=state,
                queries=section_state.get('queries', []),
                attempts=section_state.get('attempts', 0),
                excel_queries=section_state.get('excel_queries', []),
                web_queries=section_state.get('web_queries', []),
                kb_queries=section_state.get('kb_queries', [])
            )
        
        section = state.outline[state.current_section_idx]
        section_state.attempts += 1
        print(f"[DEBUG] Entering generate_section_content for section: {section.title} (Attempt {section_state.attempts})")

        # Combine context from all sources
        # Combine context from all sources - PROPERLY HANDLE LIST CASE
        raw_context = section_state.context if hasattr(section_state, 'context') else []
        
        # Convert context to string whether it's a list or single value
        if isinstance(raw_context, list):
            context_text = "\n\n---\n\n".join(str(item) for item in raw_context if item)
        else:
            context_text = str(raw_context) if raw_context else "No additional context"
        
        # Now safely trim tokens
        try:
            context_llm_text = trim_to_tokens(context_text)
        except Exception as e:
            print(f"[ERROR] Token trimming failed: {str(e)}")
            context_llm_text = context_text[:8000]  # Fallback simple truncation
        print(f"[DEBUG] Combined context for section: {section.title}")

        # Create structured LLM caller - make sure SectionContent model has data_points as optional
        structured_llm = gpt_4.with_structured_output(SectionContent, method="function_calling")

        # Generate the content
        try:
            section_content = await structured_llm.ainvoke([
                SystemMessage(content=f"""
                You are a senior financial analyst writing detailed report sections.
                Report Topic: {state.topic}
                """),
                HumanMessage(content=f"""
                Generate comprehensive content for this report section using clear formatting guidelines.

                Title: {section.title}
                Description: {section.description}
                Research Context:
                {context_llm_text}

                Requirements:
                1. The narrative should be between 300-500 words and provide clear analysis.
                2. Extract key numbers/statistics
                3. Include all relevant data points (ensure each data point includes a valid value, e.g., a number or a string; do not leave it null)
                4. **Table Formatting:**  
                - If any tables are included in the output, format them using standard markdown table syntax with a header row and a separator (e.g., using pipes and dashes).  
                - Ensure that any narrative text following a table starts on a new line, outside the table block. For example, after the markdown table, include a clear paragraph break before additional text.
                5. Use clear paragraph breaks to separate different types of content (e.g., tables versus narrative text).
                
                Please present:

                1. A **short closing paragraph** (no “### Conclusion” heading, just a clean paragraph).
                2. Up to five **key takeaways** as a bulleted list (no extra heading).
                3. A **markdown table** of your data points, with these columns: Metric, Value, Unit, Period, Source, Significance, Trend.

                Do *not* emit any JSON.  Just pure markdown.

                Please make sure that any text meant to appear after a table is not mistakenly merged into the table itself.

                IMPORTANT: The 'value' for each data point must be non-null. And no extra heading for any of the sub-sections generated through llms
                """)
            ])
            
            print(f"[DEBUG] LLM generated section content successfully")
            
            # Update section with results
            if hasattr(section_content, 'content'):
                section.content += section_content.content
            else:
                section.content += "Content generated but no content field returned"
                
            print(f"[DEBUG] generate_section_content Section Content {section.content}")
            print(f"[SUCCESS] Generated structured content for section: {section.title}")
        except Exception as e:
            print(f"[ERROR] LLM call failed for section {section.title}: {str(e)}")
            section.content = f"Content generation failed: {str(e)}"

        print(f"[DEBUG] Exiting generate_section_content for section: {section.title}")
        return section_state

def evaluate_section(section: SectionState) -> Tuple[bool, str]:
        print(f"[DEBUG] Evaluating section: {section.title}")
        txt = section.content
        fails = []
        words = txt.split()
        print(f"[DEBUG] generate_section_content Section Content {txt}")
        if len(words) < 120:
            fails.append(f"- Too short: {len(words)} words.")
        placeholders = ["TBD", "???", "placeholder"]
        if any(p in txt for p in placeholders):
            fails.append("- Found placeholder text.")
        lower_title = section.title.lower()
        if any(k in lower_title for k in ["financial", "analysis", "data", "metrics", "market"]):
            if not re.search(r"\d", txt):
                fails.append("- No numeric data found, but expected.")
        if fails:
            feed = "Please fix:\n" + "\n".join(fails)
            print(f"[DEBUG] Section '{section.title}' failed evaluation: {feed}")
            return False, feed
        print(f"[DEBUG] Section '{section.title}' passed evaluation.")
        return True, ""



CITATIONS: List[Citation] = []


async def parallel_excel_search(report_state: ReportState, queries: List[str]) -> SearchResult:
        """Asynchronously search Excel files with section-specific queries."""
        print("[DEBUG] Entering parallel_excel_search")
        if not report_state.config.excel_search:
            print("[DEBUG] Excel search disabled in config")
            return SearchResult(context_text="", citations=[], original_queries=queries)

        index = extract_excel_index(report_state.user_id, report_state.project_id)
        if not index:
            print("[DEBUG] No Excel index found")
            return SearchResult(context_text="", citations=[], original_queries=queries)

        citations = []
        context_parts = []

        # Worker to run each query in thread
        def _search(sq: str):
            query_engine = index.as_query_engine()
            resp = query_engine.query(sq)
            return sq, resp

        tasks = [asyncio.to_thread(_search, sq) for sq in queries]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for res in results:
            if isinstance(res, Exception):
                print(f"[DEBUG] Excel task failed: {res}")
                continue
            sq, excel_resp = res
            print(f"[DEBUG] Excel result for query: {sq}")
            for node in excel_resp.source_nodes:
                meta = node.metadata
                cit = ExcelCitation(
                    file_name=meta.get("file_name", "unknown"),
                    sheet=meta.get("sheet", "unknown"),
                    row=meta.get("row", 0),
                    col=meta.get("col", "unknown"),
                    value=node.text
                )
                CITATIONS.append(cit)
                citations.append(cit)
            context_parts.append(f"Excel Search Answer for '{sq}':\n{excel_resp}")

        combined = "\n\n".join(context_parts)
        return SearchResult(citations=citations, context_text=combined, original_queries=queries)

async def parallel_web_search(report_state: ReportState, queries: List[str]) -> SearchResult:
        """Asynchronously search web using Tavily for each query."""
        print("[DEBUG] Entering parallel_web_search")
        if not report_state.config.web_research:
            print("[DEBUG] Web research disabled in config")
            return SearchResult(citations=[], context_text="", original_queries=queries)

        citations = []
        context_parts = []

        tasks = [asyncio.to_thread(call_tavily_api, sq) for sq in queries]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for sq, res in zip(queries, results):
            if isinstance(res, Exception):
                print(f"[DEBUG] Web task failed for '{sq}': {res}")
                continue
            print(f"[DEBUG] Web results for query: {sq}")
            for r in res:
                cit = WebCitation(
                    title=r.get("title", "Unknown Source"),
                    url=r.get("url", ""),
                    snippet=r.get("content", r.get("snippet", ""))
                )
                CITATIONS.append(cit)
                citations.append(cit)
                context_parts.append(f"Web Result for '{sq}': {cit.title}\n{cit.snippet}")

        combined = "\n\n---\n\n".join(context_parts)
        return SearchResult(citations=citations, context_text=combined, original_queries=queries)

async def parallel_kb_query(report_state: ReportState, queries: List[str]) -> SearchResult:
        """Asynchronously query knowledge base for each query."""
        print("[DEBUG] Entering parallel_kb_query")
        citations = []
        context_parts = []

        # Worker to run KB query
        def _kb(sq: str):
            resp = query_kb(sq, KNOWLEDGE_BASE_ID, report_state.user_id, report_state.project_id, MODEL_ARN)
            return sq, resp

        tasks = [asyncio.to_thread(_kb, sq) for sq in queries]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for res in results:
            if isinstance(res, Exception):
                print(f"[DEBUG] KB task error: {res}")
                continue
            sq, resp = res
            text = resp.get('output', {}).get('text', 'No results found')
            print(f"[DEBUG] KB answer for '{sq}': {text[:30]}")
            context_parts.append(f"Knowledge Base Answer for '{sq}':\n{text}")

            for cobj in resp.get("citations", []):
                for ref in cobj.get("retrievedReferences", []):
                    cit = KBCitation(
                        chunk_text=ref.get("content", {}).get("text", ""),
                        page=ref.get("metadata", {}).get("x-amz-bedrock-kb-document-page-number"),
                        file_name=os.path.basename(ref.get("metadata", {}).get("x-amz-bedrock-kb-source-uri", "")),
                        url=get_presigned_url_from_source_uri(ref.get("metadata", {}).get("x-amz-bedrock-kb-source-uri", ""))
                    )
                    CITATIONS.append(cit)
                    citations.append(cit)
                    print("[DEBUG] Added KB citation")

        combined = "\n\n".join(context_parts)
        return SearchResult(citations=citations, context_text=combined, original_queries=queries)

async def node_section_excel_search(state: SectionState):
        print(f"[DEBUG] Entering node_section_excel_search for section: {state.title}")
        if len(state.excel_queries) > 0:
            results = await parallel_excel_search(state.report_state, state.excel_queries)
            print(f"[DEBUG] Excel search returned results for section {state.title}")
            state.excel_results.append(results)
            state.citations.extend(results.citations)
            state.context.append(results.context_text)
            return {
                "excel_results": [results],
                "citations": results.citations,
                "context": results.context_text 
            }
        print(f"[DEBUG] No Excel queries or Excel search disabled for section: {state.title}")
        return {}


async def node_section_web_search(state: SectionState):
        print(f"[DEBUG] Entering node_section_web_search for section: {state.title}")
        if len(state.web_queries) > 0:
            results = await parallel_web_search(state.report_state, state.web_queries)
            print(f"[DEBUG] Web search returned results for section {state.title}")
            state.web_results.append(results)
            print(f"[DEBUG] Appended web results")
            state.citations.extend(results.citations)
            print(f"[DEBUG] Extended citations")
            state.context.append(results.context_text)
            print(f"[DEBUG] Appended context")
            return {
                "web_results": [results],  # Return the object directly
                "citations": results.citations,
                "context": results.context_text  # String, not list
            }
        print(f"[DEBUG] No Web queries or Web research disabled for section: {state.title}")
        return {}


async def node_section_kb_search(state: SectionState):
        print(f"[DEBUG] Entering node_section_kb_search for section: {state.title}")

        if len(state.kb_queries) > 0:
            results = await parallel_kb_query(state.report_state, state.kb_queries)
            print(f"[DEBUG] Knowledge Base search returned results for section {state.title}")
            state.kb_results.append(results)
            state.citations.extend(results.citations)
            state.context.append(results.context_text)
            return {
                "kb_results": [results],  # Return the object directly
                "citations": results.citations,
                "context": results.context_text  # String, not list
            }
        print(f"[DEBUG] No KB queries or File search disabled for section: {state.title}")
        return {}

