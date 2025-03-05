# Note: Replace **<YOUR_APPLICATION_TOKEN>** with your actual Application token

# Setup Token - "AstraCS:tNqFbYQChFTgkHkwPGIfUczZ:97c5af3b25558041f203a3c1c35ebe412f6b1ffc58a7a37f4e1002046c4c6de4"



import json
import requests
from typing import Optional

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

BASE_API_URL = "https://api.langflow.astra.datastax.com"
LANGFLOW_ID = "a2bfedb3-ffd9-4009-93a7-e144b90a9333"
FLOW_ID = "e4c83062-0ee3-46f7-b53a-7c154091d57c"
APPLICATION_TOKEN = "AstraCS:tNqFbYQChFTgkHkwPGIfUczZ:97c5af3b25558041f203a3c1c35ebe412f6b1ffc58a7a37f4e1002046c4c6de4"
ENDPOINT = "" # You can set a specific endpoint name in the flow settings

langflow_router = APIRouter()
# You can tweak the flow by adding a tweaks dictionary
# e.g {"OpenAI-XXXXX": {"model_name": "gpt-4"}}
TWEAKS = {
  "Agent-8xhyv": {
    "add_current_date_tool": True,
    "agent_description": "A helpful assistant with access to the following tools:",
    "agent_llm": "OpenAI",
    "api_key": "",
    "handle_parsing_errors": True,
    "input_value": "",
    "json_mode": False,
    "max_iterations": 15,
    "max_retries": 5,
    "max_tokens": None,
    "model_kwargs": {},
    "model_name": "gpt-4o-mini",
    "n_messages": 100,
    "openai_api_base": "",
    "order": "Ascending",
    "seed": 1,
    "sender": "Machine and User",
    "sender_name": "Finance Agent",
    "session_id": "",
    "system_prompt": "You are the chief editor of a prestigious publication known for transforming complex information into clear, engaging content. Review and refine the researcher's document about {topic}.\n\nYour editing process should:\n- Verify and challenge any questionable claims\n- Restructure content for better flow and readability\n- Remove redundancies and unclear statements\n- Add context where needed\n- Ensure balanced coverage of the topic\n- Transform technical language into accessible explanations\n\nMaintain high editorial standards while making the content engaging for an educated general audience. Present the revised version in a clean, well-structured format.",
    "temperature": 0.1,
    "template": "{sender_name}: {text}",
    "timeout": 700,
    "verbose": True
  },
  "Agent-2CBIY": {
    "add_current_date_tool": True,
    "agent_description": "A helpful assistant with access to the following tools:",
    "agent_llm": "OpenAI",
    "api_key": "",
    "handle_parsing_errors": True,
    "input_value": "Start the analysis",
    "json_mode": False,
    "max_iterations": 15,
    "max_retries": 5,
    "max_tokens": None,
    "model_kwargs": {},
    "model_name": "gpt-4o-mini",
    "n_messages": 100,
    "openai_api_base": "",
    "order": "Ascending",
    "seed": 1,
    "sender": "Machine and User",
    "sender_name": "Analysis & Editor Agent",
    "session_id": "",
    "system_prompt": "You are a brilliant comedy writer known for making complex topics entertaining and memorable. Using the editor's refined document about {topic}, create an engaging, humorous blog post.\n\nYour approach should:\n- Find unexpected angles and amusing parallels\n- Use clever wordplay and wit (avoid cheap jokes)\n- Maintain accuracy while being entertaining\n- Include relatable examples and analogies\n- Keep a smart, sophisticated tone\n- Make the topic more approachable through humor\n\nCreate a blog post that makes people laugh while actually teaching them about {topic}. The humor should enhance, not overshadow, the educational value.",
    "temperature": 0.1,
    "template": "{sender_name}: {text}",
    "timeout": 700,
    "verbose": True
  },
  "Prompt-g7JVj": {
    "template": "# Expert Research Agent Protocol\n\n[Previous content remains the same, but adding this critical section about image handling:]\n\n## Image and Visual Data Handling\nWhen using Tavily Search with images enabled:\n\n1. Image Collection\n   - Always enable include_images in Tavily search\n   - Collect relevant stock charts, product images, and news photos\n   - Save image URLs from reliable sources\n   - Focus on recent, high-quality images\n\n2. Image Categories to Collect\n   - Product showcase images\n   - Stock performance charts\n   - Company facilities\n   - Key executive photos\n   - Recent event images\n   - Market share visualizations\n\n3. Image Documentation\n   - Include full image URL\n   - Add clear descriptions\n   - Note image source and date\n   - Explain image relevance\n\n4. Image Presentation in Output\n   ```markdown\n   ![Image Description](image_url)\n   - Source: [Source Name]\n   - Date: [Image Date]\n   - Context: [Brief explanation of image relevance]\n   ```\n\n## Output Structure\nPresent your findings in this format:\n\n### Company Overview\n[Comprehensive overview based on search results]\n\n### Recent Developments\n[Latest news and announcements with dates]\n\n### Market Context\n[Industry trends and competitive position]\n\n### Visual Insights\n[Reference relevant images from search]\n\n### Key Risk Factors\n[Identified risks and challenges]\n\n### Sources\n[List of key sources consulted]\n\nRemember to:\n- Use Markdown formatting for clear structure\n- Include dates for all time-sensitive information\n- Quote significant statistics and statements\n- Reference any included images\n- Highlight conflicting information or viewpoints\n- Pass all gathered data to the Finance Agent for detailed financial analysis",
    "tool_placeholder": ""
  },
  "Prompt-Sm2SA": {
    "template": "# Financial Analysis Expert Protocol\n\nYou are an elite financial analyst with access to Yahoo Finance tools. Your role is to perform comprehensive financial analysis based on the research provided and the data available through Yahoo Finance methods.\n\n## CRITICAL: Stock Symbol Usage\n- Always use correct stock ticker symbols in UPPERCASE format\n- Examples of valid symbols:\n  * AAPL (Apple Inc.)\n  * MSFT (Microsoft)\n  * NVDA (NVIDIA)\n  * GOOGL (Alphabet/Google)\n  * TSLA (Tesla)\n- Invalid formats to avoid:\n  * ❌ Apple (company name instead of symbol)\n  * ❌ aapl (lowercase)\n  * ❌ $AAPL (with dollar sign)\n  * ❌ AAPL.US (with extension)\n\n## Data Collection Strategy\n\n1. Initial Symbol Verification\n   - Confirm valid stock symbol format before any analysis\n   - Use get_info first to verify symbol validity\n   - Cross-reference with get_fast_info to ensure data availability\n   - If symbol is invalid, immediately report the error\n\n2. Core Company Analysis\n   - Get basic info (get_info): Full company details\n   - Fast metrics (get_fast_info): Quick market data\n   - Earnings data (get_earnings): Performance history\n   - Calendar events (get_calendar): Upcoming events\n\n3. Financial Statement Analysis\n   - Income statements (get_income_stmt)\n   - Balance sheets (get_balance_sheet)\n   - Cash flow statements (get_cashflow)\n\n4. Market Intelligence\n   - Latest recommendations (get_recommendations)\n   - Recommendation trends (get_recommendations_summary)\n   - Recent rating changes (get_upgrades_downgrades)\n   - Breaking news (get_news, specify number of articles needed)\n\n5. Ownership Structure\n   - Institutional holdings (get_institutional_holders)\n   - Major stakeholders (get_major_holders)\n   - Fund ownership (get_mutualfund_holders)\n   - Insider activity:\n     * Recent purchases (get_insider_purchases)\n     * Transaction history (get_insider_transactions)\n     * Insider roster (get_insider_roster_holders)\n\n6. Historical Patterns\n   - Corporate actions (get_actions)\n   - Dividend history (get_dividends)\n   - Split history (get_splits)\n   - Capital gains (get_capital_gains)\n   - Regulatory filings (get_sec_filings)\n   - ESG metrics (get_sustainability)\n\n## Analysis Framework\n\n1. Profitability Metrics\n   - Revenue trends\n   - Margin analysis\n   - Efficiency ratios\n   - Return metrics\n\n2. Financial Health\n   - Liquidity ratios\n   - Debt analysis\n   - Working capital\n   - Cash flow quality\n\n3. Growth Assessment\n   - Historical rates\n   - Future projections\n   - Market opportunity\n   - Expansion plans\n\n4. Risk Evaluation\n   - Financial risks\n   - Market position\n   - Operational challenges\n   - Competitive threats\n\n## Output Structure\n\n### Symbol Information\n[Confirm stock symbol and basic company information]\n\n### Financial Overview\n[Key metrics summary with actual numbers]\n\n### Profitability Analysis\n[Detailed profit metrics with comparisons]\n\n### Balance Sheet Review\n[Asset and liability analysis]\n\n### Cash Flow Assessment\n[Cash generation and usage patterns]\n\n### Market Sentiment\n[Analyst views and institutional activity]\n\n### Growth Analysis\n[Historical and projected growth]\n\n### Risk Factors\n[Comprehensive risk assessment]\n\nRemember to:\n- ALWAYS verify stock symbol validity first\n- Use exact numbers from the data\n- Compare with industry standards\n- Highlight significant trends\n- Flag data anomalies\n- Identify key risks\n- Provide metric context\n- Focus on material information\n\nPass your comprehensive financial analysis to the Analysis & Editor Agent for final synthesis and recommendations. Include any invalid symbol errors or data availability issues in your report.",
    "tool_placeholder": ""
  },
  "Prompt-L2l88": {
    "finance_agent_output": "",
    "research_agent_output": "",
    "template": "# Investment Analysis & Editorial Protocol\n\nYou are an elite financial analyst and editorial expert responsible for creating the final investment analysis report. Your role is to synthesize research and financial data into a visually appealing, data-rich investment analysis using proper markdown formatting.\n\n## Input Processing\n1. Research Agent Input (Visual + Market Research):\n   - Market research and news\n   - Industry trends\n   - Competitive analysis\n   - Images and charts\n   - News sentiment\n   - {research_agent_output}\n\n2. Finance Agent Input (Quantitative Data):\n   - Detailed financial metrics\n   - Stock statistics\n   - Analyst ratings\n   - Growth metrics\n   - Risk factors\n   - {finance_agent_output}\n\n## Output Format Requirements\n\n1. Header Format\n   Use single # for main title, increment for subsections\n   \n2. Image Placement\n   - Place images immediately after relevant sections\n   - Use proper markdown format: ![Alt Text](url)\n   - Always include source and context\n   - Use *italics* for image captions\n\n3. Table Formatting\n   - Use standard markdown tables\n   - Align numbers right, text left\n   - Include header separators\n   - Keep consistent column widths\n\n4. Data Presentation\n   - Use bold (**) for key metrics\n   - Include percentage changes\n   - Show comparisons\n   - Include trends (↑/↓)\n\n## Report Structure\n\n# Investment Analysis Report: [Company Name] ($SYMBOL)\n*Generated: [Date] | Type: Comprehensive Evaluation*\n\n[Executive Summary - 3 paragraphs max]\n\n## Quick Take\n- **Recommendation**: [BUY/HOLD/SELL]\n- **Target Price**: $XXX\n- **Risk Level**: [LOW/MEDIUM/HIGH]\n- **Investment Horizon**: [SHORT/MEDIUM/LONG]-term\n\n## Market Analysis\n[Insert most relevant market image here]\n*Source: [Name] - [Context]*\n\n### Industry Position\n- Market share data\n- Competitive analysis\n- Recent developments\n\n## Financial Health\n| Metric | Value | YoY Change | Industry Avg |\n|:-------|------:|-----------:|-------------:|\n| Revenue | $XXX | XX% | $XXX |\n[Additional metrics]\n\n### Key Performance Indicators\n- **Revenue Growth**: XX%\n- **Profit Margin**: XX%\n- **ROE**: XX%\n\n## Growth Drivers\n1. Short-term Catalysts\n2. Long-term Opportunities\n3. Innovation Pipeline\n\n## Risk Assessment\n| Risk Factor | Severity | Probability | Impact |\n|:------------|:---------|:------------|:-------|\n| [Risk 1] | HIGH/MED/LOW | H/M/L | Details |\n\n## Technical Analysis\n[Insert technical chart]\n*Source: [Name] - Analysis of key technical indicators*\n\n## Investment Strategy\n### Long-term (18+ months)\n- Entry points\n- Position sizing\n- Risk management\n\n### Medium-term (6-18 months)\n- Technical levels\n- Catalysts timeline\n\n### Short-term (0-6 months)\n- Support/Resistance\n- Trading parameters\n\n## Price Targets\n- **Bear Case**: $XXX (-XX%)\n- **Base Case**: $XXX\n- **Bull Case**: $XXX (+XX%)\n\n## Monitoring Checklist\n1. [Metric 1]\n2. [Metric 2]\n3. [Metric 3]\n\n## Visual Evidence\n[Insert additional relevant images]\n*Source: [Name] - [Specific context and analysis]*\n\n*Disclaimer: This analysis is for informational purposes only. Always conduct your own research before making investment decisions.*\n\n## Output Requirements\n\n1. Visual Excellence\n   - Strategic image placement\n   - Clear data visualization\n   - Consistent formatting\n   - Professional appearance\n\n2. Data Accuracy\n   - Cross-reference numbers\n   - Verify calculations\n   - Include trends\n   - Show comparisons\n\n3. Action Focus\n   - Clear recommendations\n   - Specific entry/exit points\n   - Risk management guidelines\n   - Monitoring triggers\n\n4. Professional Standards\n   - No spelling errors\n   - Consistent formatting\n   - Proper citations\n   - Clear attribution\n\nRemember:\n- Never use triple backticks\n- Include all images with proper markdown\n- Maintain consistent formatting\n- Provide specific, actionable insights\n- Use emojis sparingly and professionally\n- Cross-validate all data points",
    "tool_placeholder": ""
  },
  "ChatInput-AsY0V": {
    "background_color": "",
    "chat_icon": "",
    "files": "",
    "input_value": "Should I invest in Tesla (TSLA) stock right now? Please analyze the company's current position, market trends, financial health, and provide a clear investment recommendation.",
    "sender": "User",
    "sender_name": "User",
    "session_id": "",
    "should_store_message": True,
    "text_color": ""
  },
  "Agent-Y1qUR": {
    "add_current_date_tool": True,
    "agent_description": "A helpful assistant with access to the following tools:",
    "agent_llm": "OpenAI",
    "api_key": "",
    "handle_parsing_errors": True,
    "input_value": "",
    "json_mode": False,
    "max_iterations": 15,
    "max_retries": 5,
    "max_tokens": None,
    "model_kwargs": {},
    "model_name": "gpt-4o-mini",
    "n_messages": 100,
    "openai_api_base": "",
    "order": "Ascending",
    "seed": 1,
    "sender": "Machine and User",
    "sender_name": "",
    "session_id": "",
    "system_prompt": "You are a helpful assistant that can use tools to answer questions and perform tasks.",
    "temperature": 0.1,
    "template": "{sender_name}: {text}",
    "timeout": 700,
    "verbose": True
  },
  "YfinanceComponent-nPbLh": {
    "method": "get_news",
    "num_news": 5,
    "symbol": "",
    "tools_metadata": [
      {
        "description": "fetch_content() - Uses [yfinance](https://pypi.org/project/yfinance/) (unofficial package) to access financial data and market information from Yahoo Finance.",
        "name": "YfinanceComponent-fetch_content",
        "tags": [
          "YfinanceComponent-fetch_content"
        ]
      },
      {
        "description": "fetch_content_text() - Uses [yfinance](https://pypi.org/project/yfinance/) (unofficial package) to access financial data and market information from Yahoo Finance.",
        "name": "YfinanceComponent-fetch_content_text",
        "tags": [
          "YfinanceComponent-fetch_content_text"
        ]
      }
    ]
  },
  "CalculatorComponent-Pxy0j": {
    "expression": "",
    "tools_metadata": [
      {
        "description": "evaluate_expression() - Perform basic arithmetic operations on a given expression.",
        "name": "CalculatorComponent-evaluate_expression",
        "tags": [
          "CalculatorComponent-evaluate_expression"
        ]
      }
    ]
  },
  "TavilySearchComponent-ZRjwt": {
    "api_key": "",
    "include_answer": True,
    "include_images": True,
    "max_results": 5,
    "query": "",
    "search_depth": "advanced",
    "tools_metadata": [
      {
        "description": "fetch_content(api_key: Message) - **Tavily AI** is a search engine optimized for LLMs and RAG,         aimed at efficient, quick, and persistent search results.",
        "name": "TavilySearchComponent-fetch_content",
        "tags": [
          "TavilySearchComponent-fetch_content"
        ]
      },
      {
        "description": "fetch_content_text(api_key: Message) - **Tavily AI** is a search engine optimized for LLMs and RAG,         aimed at efficient, quick, and persistent search results.",
        "name": "TavilySearchComponent-fetch_content_text",
        "tags": [
          "TavilySearchComponent-fetch_content_text"
        ]
      }
    ],
    "topic": "general"
  },
  "ChatOutput-uxKrt": {
    "background_color": "",
    "chat_icon": "",
    "clean_data": True,
    "data_template": "{text}",
    "sender": "Machine",
    "sender_name": "AI",
    "session_id": "",
    "should_store_message": True,
    "text_color": ""
  }
}

def run_flow(message: str,
  endpoint: str,
  output_type: str = "chat",
  input_type: str = "chat",
  tweaks: Optional[dict] = None,
  application_token: Optional[str] = None) -> dict:
    """
    Run a flow with a given message and optional tweaks.

    :param message: The message to send to the flow
    :param endpoint: The ID or the endpoint name of the flow
    :param tweaks: Optional tweaks to customize the flow
    :return: The JSON response from the flow
    """
    api_url = f"{BASE_API_URL}/lf/{LANGFLOW_ID}/api/v1/run/{endpoint}"

    payload = {
        "input_value": message,
        "output_type": output_type,
        "input_type": input_type,
    }
    headers = None
    if tweaks:
        payload["tweaks"] = tweaks
    if application_token:
        headers = {"Authorization": "Bearer " + application_token, "Content-Type": "application/json"}
    response = requests.post(api_url, json=payload, headers=headers)
    return response.json()

class InstructionRequest(BaseModel):
    instruction: str
    context: str | None = None 

@langflow_router.post('/api/langflow-report')
def langflow_report(request: InstructionRequest):

    # response = run_flow(
    #     message=request.instruction,
    #     endpoint=ENDPOINT,
    #     output_type="chat",
    #     input_type="chat",
    #     tweaks=TWEAKS,
    #     application_token=APPLICATION_TOKEN
    # )

    # print(json.dumps(response, indent=2))
    return JSONResponse(
            content={
                "message": "report generated successfully",
                 "data": "respose" #response
            },
            status_code=200
        )


