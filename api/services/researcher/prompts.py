OUTLINE_PROMPT = """You are an expert market research analyst.
Create a detailed outline for a comprehensive market analysis report.
The outline should cover:
- Market size and growth trends
- Consumer behavior and segmentation
- Competitive landscape and positioning
- Regulatory environment and economic influences
- Emerging trends and growth opportunities

Provided Headings:
{headings_text}

Query Context: {query_context}

Produce a structured, actionable outline for a complete market analysis.
"""


TEMPLATE_HEADING = [
    {
        "heading": [
            "Company Overview",
            "Business Model & Operations",
            "Industry Position & Competitive Landscape",
            "Financial Performance",
            "Corporate Actions & Strategic Initiatives",
            "Corporate Actions & Strategic Initiatives",
            " Investment & Risk Analysis",
            "ESG (Environmental, Social, Governance) Factors",
        ],
        "templateId": "company-profile",
    },
    {
        "heading": [
            "Company Overview & Financial Context",
            "Financial Statements Breakdown",
            "Ratio & Trend Analysis",
            "Comparative & Benchmarking Analysis",
            "Financial Health & Risk Assessment",
            "Valuation & Investment Potential",
        ],
        "templateId": "financial-statement-analysis",
    },
    {
        "heading": [
            "Market Overview",
            "Market Segmentation & Trends",
            "Competitive Landscape & Key Players",
            "Customer Insights & Buying Behavior",
            "Market Opportunities & Challenges",
            "Business & Marketing Strategy Implications",
            "Regional & Global Market Analysis",
        ],
        "templateId": "market-size",
    },
]
