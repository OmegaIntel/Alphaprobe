import os
import json
import time
import asyncio
import re
from typing import Dict, List, Optional, Any

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

# Visualization & Logging utilities
from visualization.utils import extract_visualization_data, generate_chart
from common_logging import loginfo, logerror

# User authentication & DB session
from api.api_user import get_current_user
from db_models.session import get_db

# Pydantic validation
from pydantic import BaseModel, Field

# OpenAI & Perplexity APIs
from openai import OpenAI

# Load API Keys
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not PERPLEXITY_API_KEY:
    logerror("Perplexity API key missing. Set PERPLEXITY_API_KEY.")

if not OPENAI_API_KEY:
    logerror("OpenAI API key missing. Set OPENAI_API_KEY.")

# Initialize OpenAI & Perplexity clients
openai_client = OpenAI(api_key=OPENAI_API_KEY)
perplexity_client = OpenAI(api_key=PERPLEXITY_API_KEY, base_url="https://api.perplexity.ai")

perplexity_router = APIRouter()

# -------------------- Pydantic Models --------------------

class ResearchQuery(BaseModel):
    text: str = Field(..., description="Research query text")
    headings: Optional[List[str]] = Field([], description="List of headings to structure the response")
    max_depth: Optional[int] = Field(3, description="Depth level (1-3) for research")
    include_charts: Optional[bool] = Field(True, description="Include chart generation")
    include_tables: Optional[bool] = Field(True, description="Include tables extraction")

# -------------------- Perplexity API Call --------------------

async def get_perplexity_response(query: str, depth: int = 3, headings: List[str] = []):
    """Fetch deep research data from Perplexity AI."""
    start_time = time.time()

    print(f"🔍 [get_perplexity_response] Starting Perplexity API call for query: {query[:100]}...")
    
    # **Maximizing research details**
    system_prompt = f"""
Conduct the most **detailed** and **comprehensive** research on:

🔹 **Query:** "{query}"

📌 **Depth Level {depth} Details:**
- **Level 1:** High-level overview with key facts.
- **Level 2:** Detailed insights including references, statistics, and quotes.
- **Level 3:** Comprehensive research with structured data, historical trends, forecasts, and industry benchmarks.

📌 **Research Requirements:**
1. Extract as much structured data as possible. 
2. Provide all relevant numerical insights in table format. 
3. Include latest trends, government policies, and regulatory factors. 
4. Breakdown market segmentation, key competitors, and financial data. 
5. Use sources if available and indicate assumptions when data is missing.

📌 **Requested Structure:**
{', '.join(headings) if headings else 'Use the best possible structure for this research topic.'}

📌 **Format:**
- Begin with an **Executive Summary**.
- **Segment information** under proper headings.
- **List key statistics** in structured JSON format.
- **Provide sources** when applicable.
"""

    try:
        loginfo(f"🟢 Sending query to Perplexity API: {query[:100]}...")
        response = perplexity_client.chat.completions.create(
            model="sonar-pro",
            messages=[ {"role": "system", "content": system_prompt},  
                {"role": "user", "content": query}],
            temperature=0.1,
            max_tokens=6000  # Fetch maximum details
        )
        content = response.choices[0].message.content
        loginfo(f"✅ Perplexity API response received in {time.time() - start_time:.2f}s {content}")
        return content
    except Exception as e:
        logerror(f"❌ Perplexity API error: {e}")
        raise HTTPException(status_code=500, detail=f"Perplexity API error: {str(e)}")

# -------------------- OpenAI Structuring --------------------
async def segment_research_with_openai(research_text: str):
    """Processes Perplexity's response using OpenAI for structured segmentation."""
    print("🔄 [segment_research_with_openai] Processing research text with OpenAI...")
    
    prompt = f"""
📌 **Objective:** Extract structured insights from the following research document.

**Tasks:**
1️⃣ **Segment information into logical sections.**
2️⃣ **Extract key statistics and figures in structured JSON format.**
3️⃣ **Summarize critical takeaways in bullet points.**
4️⃣ **Identify data points for visualizations.**
5️⃣ **Extract tables in a structured JSON format.**
6️⃣ **Output `chart_suggestions` as JSON, not as text descriptions.**

🔹 **Research Document:**
{research_text}

📌 **Expected JSON Output Format:** (Ensure NO markdown code fences like ```json)
{{
    "sections": [...],
    "key_statistics": [...],
    "takeaways": [...],
    "chart_suggestions": [
        {{
            "type": "bar",
            "x": ["Country"],
            "y": ["EV Sales"],
            "data": [
                ["Germany", 500000],
                ["France", 450000]
            ]
        }},
        {{
            "type": "pie",
            "x": ["Market Share"],
            "y": ["Company"],
            "data": [
                ["Volkswagen", 30],
                ["Tesla", 40]
            ]
        }}
    ],
    "tables": [...]
}}
"""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a research analyst. Process and structure the given research data."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=6000
        )

        print("✅ [segment_research_with_openai] OpenAI API response received.")
        
        raw_response = response.choices[0].message.content.strip() if response.choices else ""
        print("🔍 [OpenAI Raw Response]:", raw_response)  # Logs full response

        if not raw_response:
            print("❌ [segment_research_with_openai] OpenAI returned an empty response!")
            return {"error": "OpenAI API returned an empty response.", "raw_response": ""}

        # 🛠️ Remove code fences (` ```json ` and ` ``` `)
        raw_response = re.sub(r"^```json\n?", "", raw_response)  # Remove opening ```json
        raw_response = re.sub(r"\n?```$", "", raw_response)  # Remove closing ```

        # Attempt to parse JSON
        try:
            structured_output = json.loads(raw_response)
        except json.JSONDecodeError:
            print("⚠️ [segment_research_with_openai] OpenAI returned invalid JSON.")
            return {"error": "OpenAI API returned invalid JSON.", "raw_response": raw_response}  # ❌ Return raw response

        # 🛠️ Ensure `chart_suggestions` key exists and is a **list of dictionaries**
        if "chart_suggestions" not in structured_output or not isinstance(structured_output["chart_suggestions"], list):
            print("⚠️ [segment_research_with_openai] Missing or incorrect `chart_suggestions`, setting default.")
            structured_output["chart_suggestions"] = []

        return structured_output

    except Exception as e:
        print(f"❌ [segment_research_with_openai] Error processing OpenAI response: {str(e)}")
        return {"error": f"OpenAI API error: {str(e)}", "raw_response": research_text}
# -------------------- FastAPI Route --------------------

@perplexity_router.post("/api/research")
async def generate_research(
    query: ResearchQuery,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches deep research using Perplexity, structures data using OpenAI, and generates visualizations."""

    print(f"🛠️ [generate_research] Received query: {query.text}")

    # **Step 1: Get Perplexity AI Research Data**
    research_text = await get_perplexity_response(query.text, depth=query.max_depth, headings=query.headings)

    # **Step 2: Process with OpenAI**
    structured_output = await segment_research_with_openai(research_text)

    # **Step 3: Generate Charts (if required)**
    if query.include_charts:
        print("📊 [generate_research] Generating charts from structured data...")
        structured_output["generated_charts"] = [generate_chart(chart) for chart in structured_output["chart_suggestions"]]

    print("🚀 [generate_research] Research successfully processed and structured.")

    # **Step 4: Return Full Structured Data**
    return JSONResponse(
        content={
            "message": "Research generated successfully",
            "result": structured_output
        },
        status_code=200
    )
