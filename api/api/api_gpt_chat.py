import os
import json
from typing import AsyncGenerator, NoReturn
from openai import AsyncOpenAI
from fastapi import WebSocket



OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = AsyncOpenAI(api_key=OPENAI_API_KEY)

def generate_prompt(topic: str, temp_id: str) -> str:
    market_sizing_promt =  f"""
      Objective:
    Conduct a comprehensive market research report for '{topic}', covering market size, key players, trends, competitive landscape, and growth potential.

    ### 1. Company Overview (if applicable)
     - What is the history, mission, and current market position of '{topic}'?
     - What are its main products/services, revenue, and market capitalization? 
     - Who are its competitors, and how does it differentiate itself?

    ### 2. Industry Overview
      - What is the current market size for '{topic}'?
      - What are the key trends and growth opportunities?
      - Who are the major competitors, and how do they compare?

    ### 3. Financial Performance
     - What are the latest revenue figures, profit margins, and earnings reports for '{topic}'?
     - How has its stock price or valuation evolved over time?

    ### 4. Market Segmentation & Trends
    - What are the major customer segments and target markets for '{topic}'?
    - What technological advancements, regulatory changes, or economic factors impact this industry?

    ### 5. Competitive Landscape
    - Who are the top competitors in the industry?
    - What are their key business strategies and unique selling points (USPs)?
     - Are there any emerging startups disrupting the market?

     ### 6. Business Strategy & Future Outlook
    - What are '{topic}'’s key growth strategies?
    - What are the major risks and challenges it faces?
    - What are the projected growth opportunities in the next 3-5 years?

    ### 🔎 Report Generation Instructions:
    - Use credible sources like financial reports, market research, and industry data.
    - Provide data-backed insights with references to major firms like Gartner, McKinsey, etc.
    - Include actionable recommendations for business strategy, marketing, and investment decisions."""
    

    financial_statement_prompt =f"""
        Conduct a **detailed financial statement analysis** for {topic}, covering key financial metrics, trends, and performance.

        ### 1. Income Statement Analysis
        - What are {topic}’s **revenues, net income, and profit margins**?
        - How have these numbers changed over the past 3-5 years?
        - What are the key **revenue drivers** and **cost structures**?

        ### 2. Balance Sheet Analysis
        - What are {topic}’s **assets, liabilities, and shareholder equity**?
        - How is its **debt-to-equity ratio**, and what does it indicate?
        - How does its balance sheet compare to competitors?

        ### 3. Cash Flow Statement Analysis
        - What is {topic}’s **operating, investing, and financing cash flow**?
        - Does {topic} have a strong **cash position**, or is it struggling with liquidity?
        - How does cash flow affect **growth and investment potential**?

        ### 4. Key Financial Ratios & Performance
        - What is {topic}’s **Price-to-Earnings (P/E), Price-to-Book (P/B), and Return on Equity (ROE)**?
        - How does {topic} compare to industry benchmarks?
        - Are there **red flags** in financial performance?

        ### 5. Future Outlook & Risks
        - What are the **growth opportunities** and risks for {topic}?
        - How do **macroeconomic factors** (inflation, interest rates) affect the company?
        - Is {topic} in a strong financial position for expansion?

        ### 🔎 Report Generation Instructions:
        - Use **credible sources** like financial reports, earnings calls, and market data.
        - Provide **data-backed insights** with charts, tables, and visualizations.
        - Offer **actionable recommendations** for investors, stakeholders, and analysts."""
    
    if temp_id =='market_sizing':
       return market_sizing_promt
    else:
        return financial_statement_prompt

async def get_ai_response(data: str, websocket: WebSocket) -> AsyncGenerator[str, None]:
    """
    OpenAI Response
    """
    parsed_data = json.loads(data[6:])
    message = parsed_data.get("promptValue")
    temp_id = parsed_data.get("reportType")
    prompt = generate_prompt(message, temp_id)
    
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an expert financial analyst."},
            {
                "role": "user",
                "content": prompt,
            },
        ],
        
        stream=True,
    )

    async for chunk in response:
        if chunk.choices:
            await websocket.send_json({"type":"report", "output": chunk.choices[0].delta.content or "" })
        