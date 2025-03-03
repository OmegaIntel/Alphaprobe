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



# helper function to transform the chart data
def transform_chart_data(chart_suggestion):
    """
    Transform OpenAI chart suggestion format to the format expected by generate_chart
    """
    transformed = {
        "chart_type": chart_suggestion.get("chart_type", "bar"),
        "title": chart_suggestion.get("title", "Chart"),
        "x_label": chart_suggestion.get("x_label", ""),
        "y_label": chart_suggestion.get("y_label", "")
    }
    
    # Handle the data format transformation
    if "data" in chart_suggestion and isinstance(chart_suggestion["data"], list):
        # Check if data is in {x, y} format
        if all(isinstance(item, dict) and "x" in item and "y" in item for item in chart_suggestion["data"]):
            transformed["labels"] = [item["x"] for item in chart_suggestion["data"]]
            transformed["values"] = [item["y"] for item in chart_suggestion["data"]]
        else:
            # Fallback: assume data is already in expected format
            print("⚠️ [transform_chart_data] Data format is not in {x,y} structure. Using as is.")
            transformed["labels"] = chart_suggestion.get("labels", [])
            transformed["values"] = chart_suggestion.get("values", [])
    else:
        # If no data property, check for direct labels and values
        transformed["labels"] = chart_suggestion.get("labels", [])
        transformed["values"] = chart_suggestion.get("values", [])
    
    print(f"📊 [transform_chart_data] Transformed chart: {transformed['title']}, Labels: {len(transformed['labels'])}, Values: {len(transformed['values'])}")
    
    return transformed
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

    # **Enhanced Prompt for Structured Output**
    prompt = f"""
📌 **Objective:** Process the given research document and extract structured insights for easy visualization.

---

### **Tasks:**
1️⃣ **Segment information into logical sections with clear headings.**
2️⃣ **Extract key statistics and figures in structured JSON format.**
3️⃣ **Summarize critical takeaways in bullet points.**
4️⃣ **Identify numerical data suitable for charts and provide JSON-ready chart suggestions.**
5️⃣ **Extract tables in a structured JSON format (with column names and rows).**
6️⃣ **Detect and list image URLs (if any) for relevant sections.**
7️⃣ **Ensure ALL structured outputs are in a valid JSON format, without Markdown code fences.**

---

### **Research Document:**
{research_text}

---

### **Expected JSON Output Format:**
{{
    "sections": [
        {{
            "title": "Heading 1",
            "content": "Detailed content of the section..."
        }},
        {{
            "title": "Heading 2",
            "content": "More detailed content..."
        }}
    ],
    
    "key_statistics": [
        {{
            "name": "Market Size (2023)",
            "value": "500 Billion USD"
        }},
        {{
            "name": "Annual Growth Rate",
            "value": "8.2%"
        }}
    ],
    
    "takeaways": [
        "Key insight 1...",
        "Key insight 2...",
        "Key insight 3..."
    ],

    "chart_suggestions": [
        {{
            "chart_type": "bar",
            "title": "Market Growth by Region",
            "x_label": "Region",
            "y_label": "Market Size (Billion USD)",
            "data": [
                {{"x": "North America", "y": 150}},
                {{"x": "Europe", "y": 130}},
                {{"x": "Asia", "y": 220}}
            ]
        }},
        {{
            "chart_type": "pie",
            "title": "Market Share Distribution",
            "data": [
                {{"x": "Company A", "y": 40}},
                {{"x": "Company B", "y": 35}},
                {{"x": "Company C", "y": 25}}
            ]
        }}
    ],

    "tables": [
        {{
            "title": "Top Market Segments",
            "headers": ["Segment", "Revenue (Billion USD)", "Growth Rate"],
            "rows": [
                ["Food & Beverage", "50", "6.2%"],
                ["Healthcare", "80", "7.5%"],
                ["Technology", "120", "10.1%"]
            ]
        }}
    ],

    "image_urls": [
        "https://example.com/image1.png",
        "https://example.com/image2.jpg"
    ]
}}

---

📌 **Guidelines:**
- **ALL extracted data must be structured as JSON** (no Markdown or text descriptions).
- **Ensure numerical data is correctly formatted for visualization**.
- **Provide only valid JSON output**, ensuring keys like `"chart_suggestions"`, `"tables"`, and `"key_statistics"` are properly structured.
"""

    try:
        # **Call OpenAI API for structured response**
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

        # Extract response content
        raw_response = response.choices[0].message.content.strip() if response.choices else ""
        print("🔍 [OpenAI Raw Response]:", raw_response)  # Logs full response

        if not raw_response:
            print("❌ [segment_research_with_openai] OpenAI returned an empty response!")
            return {"error": "OpenAI API returned an empty response.", "raw_response": ""}

        # 🛠️ Remove code fences (` ```json ` and ` ``` `)
        raw_response = re.sub(r"^```json\n?", "", raw_response)  # Remove opening ```json
        raw_response = re.sub(r"\n?```$", "", raw_response)  # Remove closing ```

        # **Attempt to parse JSON**
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
        generated_charts = []
        
        for chart_suggestion in structured_output.get("chart_suggestions", []):
            # Transform data format if needed
            chart_data = transform_chart_data(chart_suggestion)
            chart_image = generate_chart(chart_data)
            generated_charts.append({
                "suggestion": chart_suggestion,
                "image": chart_image
            })
            
        structured_output["generated_charts"] = generated_charts

    print("🚀 [generate_research] Research successfully processed and structured.")

    # **Step 4: Return Full Structured Data**
    return JSONResponse(
        content={
            "message": "Research generated successfully",
            "result": structured_output
        },
        status_code=200
    )
