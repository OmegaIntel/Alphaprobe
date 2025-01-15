import asyncio
import os
import nest_asyncio
from typing import List, Union
from pathlib import Path

# Apply nest_asyncio to handle nested async calls
nest_asyncio.apply()

# Configuration for local storage: base directory for all indexes/reports
BASE_PERSIST_DIR = "./storage"

# Create necessary base directory
os.makedirs(BASE_PERSIST_DIR, exist_ok=True)

# Configuration for Llama Index and OpenAI
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.core import Settings, VectorStoreIndex, StorageContext, load_index_from_storage
from llama_index.core.tools import QueryEngineTool
from llama_index.core.workflow import (
    step,
    Event,
    Context,
    StartEvent,
    StopEvent,
    Workflow,
)
from llama_index.core.agent import FunctionCallingAgent
from llama_parse import LlamaParse


# Set up environment variables
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"] 
LLAMA_CLOUD_API_KEY = os.environ["LLAMA_CLOUD_API_KEY"] 

def setup_models():
    """Initialize LLM and embedding models"""
    Settings.llm = OpenAI(
        model="gpt-4o-mini",
        temperature=0.1
    )
    Settings.embed_model = OpenAIEmbedding(
        model="text-embedding-3-large",
        dimensions=1024
    )

# Event classes for the workflow
class OutlineEvent(Event):
    outline: str

class QuestionEvent(Event):
    question: str

class AnswerEvent(Event):
    question: str
    answer: str

class ReviewEvent(Event):
    report: str

class ProgressEvent(Event):
    progress: str



async def process_uploaded_documents(file_paths: List[str], user_id: str, deal_id: str) -> bool:
    """
    Process multiple uploaded documents and create a combined index.
    First checks if index already exists, only creates new if needed.
    Returns True if successful (either existing or new), False otherwise.
    """
    try:
        setup_models()
        
        # Create persist directory path
        persist_dir = os.path.join(BASE_PERSIST_DIR, user_id, deal_id)
        
        # Check if persist directory and index files exist
        if os.path.exists(persist_dir) and os.path.exists(os.path.join(persist_dir, "docstore.json")):
            try:
                # Try to load existing index
                storage_context = StorageContext.from_defaults(persist_dir=persist_dir)
                index = load_index_from_storage(storage_context)
                print(f"Found and loaded existing index from: {persist_dir}")
                return True
            except Exception as e:
                print(f"Error loading existing index: {str(e)}. Will create new index.")
                # If loading fails, continue to create new index
                pass
        
        # Create directory if it doesn't exist
        os.makedirs(persist_dir, exist_ok=True)
        
        # Parse all documents and create a combined index
        print(f"Creating new index for documents: {file_paths}")
        parser = LlamaParse(result_type="markdown")
        all_documents = []
        
        for file_path in file_paths:
            documents = await parser.aload_data(file_path)
            all_documents.extend(documents)
        
        # Create and persist combined index
        index = VectorStoreIndex.from_documents(all_documents)
        index.storage_context.persist(persist_dir=persist_dir)
        
        print(f"Successfully created and stored new combined index in: {persist_dir}")
        return True
        
    except Exception as e:
        print(f"Error in process_uploaded_documents: {str(e)}")
        import traceback
        traceback.print_exc()
        return False



def get_index_from_storage(user_id: str, deal_id: str) -> Union[VectorStoreIndex, None]:
    """
    Retrieve existing index from storage based on user_id and deal_id.
    """
    try:
        persist_dir = os.path.join(BASE_PERSIST_DIR, user_id, deal_id)
        
        if not os.path.exists(persist_dir):
            print(f"No index found for user {user_id} and deal {deal_id}")
            return None
            
        storage_context = StorageContext.from_defaults(persist_dir=persist_dir)
        index = load_index_from_storage(storage_context)
        print(f"Successfully loaded index from {persist_dir}")
        return index
        
    except Exception as e:
        print(f"Error loading index: {str(e)}")
        return None

class DocumentResearchAgent(Workflow):
    """Financial Due Diligence Report Generation Workflow"""
    
    @step()
    async def formulate_plan(self, ctx: Context, ev: StartEvent) -> OutlineEvent:
        data = ev.query
        query_context = data.get("query", "")
        headings = data.get("headings", [])
        
        # Format the headings as a numbered list
        if headings:
            headings_text = "\n".join([f"{i+1}. {heading}" for i, heading in enumerate(headings)])
        else:
            headings_text = "No specific headings provided."

        await ctx.set("original_query", query_context)
        await ctx.set("headings", headings)
        await ctx.set("tools", ev.tools)

        prompt = f"""You are an expert financial analyst conducting research and due diligence. Create a detailed outline 
        for a comprehensive due diligence report. The outline should follow standard due diligence 
        practices and cover all critical areas of financial analysis.
        The outline should include, but not be limited to:
        
        {headings_text}

        Query Context: {query_context}

        Create a detailed, actionable outline that will guide a thorough financial diligence investigation."""
        
        response = await Settings.llm.acomplete(prompt)
        
        ctx.write_event_to_stream(
            ProgressEvent(progress="Generated Financial Due Diligence Outline:\n" + str(response))
        )
        return OutlineEvent(outline=str(response))
    
    @step()
    async def formulate_questions(self, ctx: Context, ev: OutlineEvent) -> None:
        outline = ev.outline
        await ctx.set("outline", outline)
        
        prompt = f"""As a financial expert, create specific questions to extract critical 
        financial information from the company documents. Focus on quantitative and qualitative aspects 
        that are essential for a thorough financial analysis.

        For each question, consider:
        - Historical financial performance trends
        - Key financial metrics and ratios
        - Quality of earnings and revenue recognition
        - Working capital efficiency
        - Cash flow sustainability
        - Balance sheet strength and potential risks
        - Accounting policy impacts
        - One-time or extraordinary items
        - Forward-looking assumptions

        Rules:
        - Each question should target specific, measurable financial information
        - Include both historical analysis and forward-looking assessment
        - Focus on material items and significant trends
        - Consider both reported figures and underlying drivers
        - Look for potential red flags or areas needing further investigation
        - Limit to 15 key questions that will provide comprehensive coverage

        Outline to analyze: {outline}"""
        
        response = await Settings.llm.acomplete(prompt)
        questions = str(response).split("\n")
        questions = [x.strip() for x in questions if x.strip()]
        
        await ctx.set("num_questions", len(questions))
        ctx.write_event_to_stream(
            ProgressEvent(progress="Financial Analysis Questions:\n" + "\n".join(questions))
        )
        
        for question in questions:
            ctx.send_event(QuestionEvent(question=question))
    
    @step()
    async def answer_questions(self, ctx: Context, ev: QuestionEvent) -> AnswerEvent:
        """Answer each question using the LLM with retrieved top_k chunks."""
        question = ev.question
        
        # Retrieve the query_tool from the context (assumes only one is provided)
        tools = await ctx.get("tools")
        query_tool = tools[0]
        
        # Retrieve top_k relevant chunks for the question
        retrieved_chunks = query_tool.query_engine.query(question)
        
        prompt = f"""You are a financial analyst. Provide a detailed and accurate answer to the following question based on the provided company documents:

        Question: {question}

        Context: {retrieved_chunks}

        Answer:"""
        
        response = await Settings.llm.acomplete(prompt)
        answer_text = response.text if hasattr(response, "text") else str(response)
        
        ctx.write_event_to_stream(
            ProgressEvent(progress=f"Answered Question: {question}\nAnswer: {answer_text}")
        )
        
        return AnswerEvent(question=question, answer=answer_text)
    
    @step()
    async def write_report(self, ctx: Context, ev: AnswerEvent) -> ReviewEvent:
        num_questions = await ctx.get("num_questions")
        
        # Collect all AnswerEvent instances from the workflow
        all_answers = ctx.collect_events(ev, expected=[AnswerEvent])
        results = all_answers[:num_questions]
        
        if not results:
            ctx.write_event_to_stream(
                ProgressEvent(progress="No answers found to generate the report.")
            )
            return ReviewEvent(report="No report generated due to missing answers.")
        
        try:
            previous_questions = await ctx.get("previous_questions")
        except Exception:
            previous_questions = []
        
        previous_questions.extend(results)
        await ctx.set("previous_questions", previous_questions)
        
        outline = await ctx.get('outline')
        prompt = f"""You are a senior financial analyst preparing a comprehensive report.
        Using the provided research findings, create a detailed financial report that:
                
        1. Follows a clear, professional structure
        2. Provides detailed analysis supported by specific data points
        3. Highlights key trends and material findings
        4. Identifies potential risks and red flags
        5. Offers clear, actionable conclusions and recommendations
                
        Guidelines:
        - Use precise financial terminology
        - Include specific figures, calculations, and metrics
        - Explain significant variances and trends
        - Highlight any unusual or concerning findings
        - Provide context for your analysis
        - Make clear, data-supported recommendations
        - Use professional formatting with clear sections and subsections
                
        Outline: {outline}
                
        Research Findings:"""
        
        for result in previous_questions:
            prompt += f"\nQuestion: {result.question}\nAnalysis: {result.answer}\n"
        
        ctx.write_event_to_stream(
            ProgressEvent(progress="Generating Diligence Report...")
        )
        
        report = await Settings.llm.acomplete(prompt)
        
        return ReviewEvent(report=str(report))
    
    @step()
    async def review_report(self, ctx: Context, ev: ReviewEvent) -> Union[StopEvent, QuestionEvent]:
        try:
            num_reviews = await ctx.get("num_reviews")
        except Exception:
            num_reviews = 1

        num_reviews += 1
        await ctx.set("num_reviews", num_reviews)
        
        report = ev.report
        original_query = await ctx.get("original_query")
        prompt = f"""As a senior financial reviewer, assess this due diligence report for:

        1. Completeness of Financial Analysis
        - Coverage of all key financial areas
        - Depth of quantitative analysis
        - Quality of insights and implications

        2. Technical Accuracy
        - Correctness of calculations and ratios
        - Validity of financial assumptions
        - Consistency with accounting standards

        3. Risk Assessment
        - Identification of material risks
        - Evaluation of financial impacts
        - Completeness of risk coverage

        4. Quality of Recommendations
        - Clarity and actionability
        - Support by financial evidence
        - Relevance to findings

        5. Professional Standards
        - Clarity and structure
        - Supporting evidence
        - Professional tone

        Original Request: '{original_query}'
                
        Report to Review:
        {report}
                
        If improvements are needed, list up to 3 specific questions to gather missing financial information.
        If the report meets professional due diligence standards, respond with 'APPROVED'."""
        
        response = await Settings.llm.acomplete(prompt)
        result_text = response.text if hasattr(response, "text") else str(response)
        
        if result_text.strip().upper() == "APPROVED" or num_reviews >= 3:
            ctx.write_event_to_stream(
                ProgressEvent(progress="Financial Due Diligence Report Approved")
            )
            return StopEvent(result=report)
        else:
            questions = [q.strip() for q in result_text.split("\n") if q.strip()]
            await ctx.set("num_questions", len(questions))
            ctx.write_event_to_stream(
                ProgressEvent(progress="Additional financial analysis required")
            )
            for question in questions:
                ctx.send_event(QuestionEvent(question=question))
            return None

async def generate_structured_report(query: dict, user_id: str, deal_id: str):
    """
    Generate report using existing index from storage.
    No longer requires file_path parameter.
    """
    try:
        setup_models()
        
        # Get existing index
        index = get_index_from_storage(user_id, deal_id)
        if not index:
            return {"error": "No processed document found for this user/deal combination"}
            
        # Create query tool
        query_tool = QueryEngineTool.from_defaults(
            index.as_query_engine(similarity_top_k=10),
            name="document_analysis_tool",
            description="Tool for analyzing document content"
        )
        
        # Initialize and run agent
        agent = DocumentResearchAgent(timeout=600, verbose=True)
        handler = agent.run(query=query, tools=[query_tool])
        
        final_report = None
        async for ev in handler.stream_events():
            if isinstance(ev, ProgressEvent):
                print(ev.progress)
            elif isinstance(ev, StopEvent):
                final_report = ev.result
        
        if final_report:
            persist_dir = os.path.join(BASE_PERSIST_DIR, user_id, deal_id)
            output_path = os.path.join(persist_dir, "generated_report.txt")
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(final_report)
            print(f"Report exported to: {output_path}")
                
        return final_report
        
    except Exception as e:
        print(f"Error generating report: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


# Example usage for multiple files
if __name__ == "__main__":
    # Replace these values with the appropriate file paths, query, user_id, and deal_id.
    test_file_paths = [
        "/Users/chetan/Downloads/Dollar Cave Club Model MASTER 2022.xlsx",
        "/Users/chetan/Downloads/Additional_Financial_Data.xlsx",
        "/Users/chetan/Downloads/Market_Analysis_Report.pdf"
    ]
    test_query = {
        "query": "Generate a detailed financial analysis of the key themes and findings in these documents",
        "headings": [
            "Market Overview",
            "Competitive Landscape",
            "Market Trends",
            "Growth Opportunities",
            "Market Challenges"
        ]
    }
    test_user_id = "User123"
    test_deal_id = "Deal456"
    
    # Process multiple files and create a combined index
    asyncio.run(process_uploaded_documents(
        test_file_paths,
        test_user_id,
        test_deal_id
    ))
    
    # Generate the structured report using the combined index
    asyncio.run(generate_structured_report(
        test_query,
        test_user_id,
        test_deal_id
    ))