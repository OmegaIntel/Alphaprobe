DEFAULT_REPORT_STRUCTURE = """The report structure should focus on providing a comprehensive breakdown of the user-provided topic. Ensure sections are logically structured, with research-driven insights where applicable.

1. **Introduction** (no research needed)
   - Overview of the topic area, including its relevance and importance.
   - Purpose and scope of the report.

2. **Executive Summary** (high-level overview)
   - Brief summary of the key findings.
   - Summary of recommendations.

3. **Main Body Sections** (customizable to the topic):
   3.1 **Financial Performance Analysis** (or core performance analysis)  
       - Historical trends, revenue growth, and profitability.
       - Quality of earnings or performance metrics.
       - Cost structure, margin analysis, and adjustments.
       - Key risks and challenges (e.g., customer concentration risks).

   3.2 **Balance Sheet Review**  
       - Asset quality, valuation, and receivables.
       - Debt and liability structure.
       - Off-balance sheet items.

   3.3 **Cash Flow Analysis**  
       - Operating cash flow health.
       - Capital expenditures and allocation.
       - Working capital and liquidity management.

   3.4 **Projections and Assumptions**  
       - Management forecasts and underlying assumptions.
       - Stress-testing and sensitivity analysis.
       - Comparisons to historical trends.

   3.5 **Key Financial Metrics and KPIs**  
       - Liquidity, profitability, and efficiency metrics.
       - Areas for improvement.

   3.6 **Risk Assessment**  
       - Financial risks (e.g., credit, liquidity, and market risks).
       - Operational and supply chain risks.
       - External risks (e.g., competition and regulatory risks).

4. **Accounting Policies and Practices**  
   - Compliance with accounting standards.
   - Internal controls and financial integrity.
   - Identification of irregularities, if any.

5. **Tax Considerations**  
   - Tax compliance and strategies.
   - Outstanding disputes or liabilities.

6. **Key Findings and Red Flags**  
   - Critical findings from the report.
   - Potential risks and red flags for immediate attention.
   - Implications for future financial health.

7. **Recommendations**  
   - Actionable recommendations based on findings.
   - Cost management and operational efficiency improvements.
   - Cash flow and revenue optimization strategies.

8. **Conclusion**  
   - Recap of the key points.
   - High-level summary of risks, findings, and suggested actions.
   - Include any tables, lists, or visual summaries to enhance clarity.

---
**Note**: This structure is flexible enough to be adapted for topics outside financial due diligence, focusing on organizing key findings, risks, and actionable recommendations in any complex analysis.
"""


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
