import os
from langchain.prompts import ChatPromptTemplate
from langchain.tools.tavily_search import TavilySearchResults
from langchain_core.runnables import RunnableLambda

# LangChain + LLM
from langchain_openai import ChatOpenAI
import openai

from langgraph.graph import StateGraph, END
from typing import TypedDict

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

OPEN_ROUTER_API_KEY = "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"

# llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.1, api_key=OPENAI_API_KEY)

llm = ChatOpenAI( base_url="https://openrouter.ai/api/v1",
    api_key=OPEN_ROUTER_API_KEY,
    model="deepseek/deepseek-r1-zero:free",  # e.g., "openrouter/mistralai/mixtral-8x7b"
    temperature=0.7)

search_tool = TavilySearchResults(max_results=5)

CompanyProfiler = RunnableLambda(lambda inputs: {
    **inputs, 
    "profile": llm.invoke(ChatPromptTemplate.from_template(
        """
        Conduct a detailed company overview for "{company_name}". Include:
        - Industry sector
        - Core products/services
        - Target markets
        - Revenue model and monetization strategy
        - Founders and leadership team
        - Headquarters location
        - Mission and vision statements
        - Key milestones and company history

        Use the most recent info found online and from Tavily search results:
        {search_results}
        """
    ).format_prompt(
        company_name=inputs["company_name"],
        search_results=search_tool.run(inputs["company_name"])
    )).content
})

FinancialAnalyzer = RunnableLambda(lambda inputs: {
     **inputs, 
    "financials": llm.invoke(ChatPromptTemplate.from_template(
        """
        Analyze financials of "{company_name}". Using the following data:
        {financial_data}

        Perform:
        - Revenue and net income trend over past 3 years
        - Key ratios: Gross margin, Operating margin, EPS, ROE, ROA
        - Year-over-year growth comparison
        - Commentary on profitability, sustainability, and risk

        Return analysis in bullet point + short paragraph format.
        """
    ).format_prompt(
        company_name=inputs["company_name"],
        financial_data=search_tool.run(f"{inputs['company_name']} last 3 year financials site:macrotrends.net OR site:yahoo.com OR site:finviz.com")
    ).to_string()).content
})

StockPerformanceAnalyzer = RunnableLambda(lambda inputs: {
     **inputs, 
    "stock_data": llm.invoke(ChatPromptTemplate.from_template(
        """
        Analyze recent stock performance for "{company_name}" based on:
        - Past 6-month and 1-year price trend
        - Trading volume spikes
        - Volatility metrics
        - Stock splits or major events
        - Correlation with industry index

        Use stock data below:
        {stock_info}
        """
    ).format_prompt(
        company_name=inputs["company_name"],
        stock_info=search_tool.run(f"{inputs['company_name']} stock performance last 1 year")
    )).content
})

CashFlowAnalyzer = RunnableLambda(lambda inputs: {
     **inputs, 
    "cashflow": llm.invoke(ChatPromptTemplate.from_template(
        """
        Examine the cash flow position of "{company_name}" using this data:
        {cashflow_data}

        Evaluate:
        - Operating vs Investing vs Financing cash flows
        - Free cash flow trends
        - Cash flow from operations as % of net income
        - Red flags like negative OCF or inconsistent cash patterns
        """
    ).format_prompt(
        company_name=inputs["company_name"],
        cashflow_data=search_tool.run(f"{inputs['company_name']} latest cash flow statement")
    )).content
})

CompetitorAnalyzer = RunnableLambda(lambda inputs: {
     **inputs, 
    "competitors": llm.invoke(ChatPromptTemplate.from_template(
        """
        Identify top 3-5 direct competitors of "{company_name}" and compare:
        - Market share and positioning
        - Core products
        - Strengths and weaknesses
        - Recent moves (mergers, partnerships, launches)
        - How "{company_name}" differentiates itself

        Base your analysis on Tavily search:
        {search_results}
        """
    ).format_prompt(
        company_name=inputs["company_name"],
        search_results=search_tool.run(f"{inputs['company_name']} competitors")
    )).content
})

NewsSentimentAnalyzer = RunnableLambda(lambda inputs: {
     **inputs, 
    "sentiment": llm.invoke(ChatPromptTemplate.from_template(
        """
        Using the latest news articles and press coverage of "{company_name}" found via Tavily:
        {search_results}

        Perform:
        - Sentiment analysis (positive/neutral/negative)
        - Mention common themes or controversies
        - Public perception and media tone
        - Potential risks or investor alerts
        """
    ).format_prompt(
        company_name=inputs["company_name"],
        search_results=search_tool.run(f"{inputs['company_name']} latest news")
    )).content
})


MacroTrendAnalyzer = RunnableLambda(lambda inputs: {
     **inputs, 
    "macro": llm.invoke(ChatPromptTemplate.from_template(
        """
        Evaluate how macroeconomic trends are impacting "{company_name}". Consider:
        - Industry-specific trends
        - Interest rates and inflation
        - Regulatory or geopolitical risks
        - Supply chain or commodity-related factors

        Use Tavily search insights:
        {search_results}
        """
    ).format_prompt(
        company_name=inputs["company_name"],
        search_results=search_tool.run(f"{inputs['company_name']} macroeconomic trends")
    )).content
})

ForecastGenerator = RunnableLambda(lambda inputs: {
     **inputs, 
    "forecast": llm.invoke(ChatPromptTemplate.from_template(
        """
        Generate performance forecasts for "{company_name}" over the next 1-2 years:
        - Revenue and profit estimates
        - Potential challenges and risks
        - Opportunities for growth
        - Impact of current trends

        Base predictions on prior analysis:
        Financials: {financials}
        Macro Trends: {macro}
        Sentiment: {sentiment}
        """
    ).format_prompt(
        company_name=inputs["company_name"],
        financials=inputs["financials"],
        macro=inputs["macro"],
        sentiment=inputs["sentiment"]
    )).content
})


StrategyRecommender = RunnableLambda(lambda inputs: {
     **inputs, 
    "strategy": llm.invoke(ChatPromptTemplate.from_template(
        """
        Based on all insights so far, recommend strategies for:
        - Investors (buy/sell/hold with reasoning)
        - Stakeholders (growth or risk mitigation)
        - Company (strategic priorities)

        Use the following insights:
        Forecast: {forecast}
        Competitors: {competitors}
        Sentiment: {sentiment}
        """
    ).format_prompt(
        forecast=inputs["forecast"],
        competitors=inputs["competitors"],
        sentiment=inputs["sentiment"]
    )).content
})

ReportCompiler = RunnableLambda(lambda inputs: {
     **inputs, 
    "final_report": llm.invoke(ChatPromptTemplate.from_template(
        """
        Assemble a 10–12 page professional market research report for "{company_name}" using:

        - Company Profile
        - Financial Overview
        - Stock Performance
        - Cash Flow Analysis
        - Competitor Comparison
        - Sentiment Analysis
        - Macroeconomic Trends
        - Forecast & Strategic Insights

        Format with:
        - Section headings
        - Bullet points, tables (described in markdown), charts (suggest)
        - Executive summary and conclusion

        Report Data:
        {profile}
        {financials}
        {stock_data}
        {cashflow}
        {competitors}
        {sentiment}
        {macro}
        {forecast}
        {strategy}
        """
    ).format_prompt(**inputs)).content
})

class MarketAnalysisState(TypedDict):
    company_name: str
    profile: str
    financials: str
    stock_data: str
    cashflow: str
    competitors: str
    sentiment: str
    macro: str
    forecast: str
    strategy: str
    final_report: str

workflow = StateGraph(MarketAnalysisState)

workflow.add_node("CompanyProfiler", CompanyProfiler)
workflow.add_node("FinancialAnalyzer", FinancialAnalyzer)
workflow.add_node("StockPerformanceAnalyzer", StockPerformanceAnalyzer)
workflow.add_node("CashFlowAnalyzer", CashFlowAnalyzer)
workflow.add_node("CompetitorAnalyzer", CompetitorAnalyzer)
workflow.add_node("NewsSentimentAnalyzer", NewsSentimentAnalyzer)
workflow.add_node("MacroTrendAnalyzer", MacroTrendAnalyzer)
workflow.add_node("ForecastGenerator", ForecastGenerator)
workflow.add_node("StrategyRecommender", StrategyRecommender)
workflow.add_node("ReportCompiler", ReportCompiler)

workflow.set_entry_point("CompanyProfiler")
workflow.add_edge("CompanyProfiler", "FinancialAnalyzer")
workflow.add_edge("FinancialAnalyzer", "StockPerformanceAnalyzer")
workflow.add_edge("StockPerformanceAnalyzer", "CashFlowAnalyzer")
workflow.add_edge("CashFlowAnalyzer", "CompetitorAnalyzer")
workflow.add_edge("CompetitorAnalyzer", "NewsSentimentAnalyzer")
workflow.add_edge("NewsSentimentAnalyzer", "MacroTrendAnalyzer")
workflow.add_edge("MacroTrendAnalyzer", "ForecastGenerator")
workflow.add_edge("ForecastGenerator", "StrategyRecommender")
workflow.add_edge("StrategyRecommender", "ReportCompiler")
workflow.add_edge("ReportCompiler", END)

app = workflow.compile()

# Example run

async def new_generate_report(instruction: str):
    print("[DEBUG] Entering generate_report endpoint")
    

    try:
        # print(f"[generate_report] Step 1: Received query: {query}")
        # print(f"[generate_report] Step 2: Received project_id: {query.project_id}")
        # print("[generate_report] Step 3: Validating deal ID and user...")
        
    

        output = app.invoke({
            "company_name": instruction
        })


        
        
        print("[generate_report] Step 6: Report generated successfully.")
        print("[generate_report] Step 7: Saving report to database...")
        
        print("[DEBUG] Exiting generate_report endpoint with success.")
        return {
                "message": "Report generated and saved successfully",
                "report": output["final_report"],
            }
    except Exception as e:
        print(f"[generate_report] Error encountered: {str(e)}")
        
        print("[DEBUG] Exiting generate_report endpoint with error.")
        