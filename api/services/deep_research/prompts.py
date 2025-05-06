# ------------------------------------------------------------------------
# Prompts
# 1. Company profile
# 2. Financial Statement Analysis
# 3. Market Sizing
# ------------------------------------------------------------------------


REPORT_PLANNER_QUERY_WRITER_INSTRUCTIONS = [
    """You are an expert financial and industry analyst. Your task is to propose specific search queries that will extract the necessary data to populate an industry report. 
    Query Context: {topic}
    Focus on company profile elements such as management, business models, industry position, financial performance, corporate actions, and news. Incorporate insights from the following tags: Investment Research, Target Screening, Corporate Due Diligence, Competitive Research.
    """,
    """You are an expert financial and industry analyst. Your task is to propose specific search queries that will extract the necessary data to populate an industry report.
    Query Context: {topic}
    Focus on financial statement analysis, including the evaluation of financial health, profitability, liquidity, and solvency. Incorporate analysis angles from the following tags: Financial Analysis, Ratio and Trend Analysis, Portfolio Monitoring, Valuation.
    """,
    """You are an expert financial and industry analyst. Your task is to propose specific search queries that will extract the necessary data to populate an industry report.
    Query Context: {topic}
    Focus on market sizing elements, including market size, segmentation, key players, trends, and competitive dynamics. Incorporate analysis angles from the following tags: Market Research, Business Consulting, Strategy, Marketing.
    """,
]

# not used currently - Fixed Outline - change this to a dynamic outline using file content from user provided pdf
# -----------------------------------------------------------------------------

REPORT_PLANNER_INSTRUCTIONS = [
    """
You are an expert financial and industry analyst. Based on the topic and combined content, produce a structured outline for an industry report.

Required PDF Sections (MUST INCLUDE VERBATIM):
{pdf_sections}

Additional Context:
Topic: {topic}
Document Context: {context}

Generate an outline that:
1. Preserves all PDF sections exactly as provided.
2. Any new section should not be similar to the already provided sections in the PDF.
3. Adds complementary sections for a comprehensive company profile covering:
   - Management structure
   - Business model analysis  
   - Industry positioning
   - Financial performance highlights
   - Recent corporate actions
   - Relevant news/developments

Tags to incorporate: Investment Research, Target Screening, Corporate Due Diligence, Competitive Research

Output format:
- Output the outline as a JSON array of section objects.
- Each section object must include exactly one key for the section title (use the key "name") and one key for the section description.
- Use the EXACT same section titles from the PDF where applicable.
- Mark new sections with the "[Additional Research]" prefix.
- All section objects must be unique.
- IMPORTANT: Do not include duplicate title fields or multiple values for a section's title.
- Create At most 10 sections
""",
    """
You are an expert financial analyst. Based on the topic and combined content, produce a structured financial analysis outline.

Required PDF Sections (MUST INCLUDE VERBATIM):
{pdf_sections}

Additional Context:
Topic: {topic}
Document Context: {context}

Generate an outline that:
1. Preserves all financial tables/charts from the PDF exactly.
2. Any new section should not be similar to the already provided sections in the PDF.
3. Adds necessary sections for complete analysis, including:
   - Financial health assessment
   - Profitability deep dive  
   - Liquidity analysis
   - Solvency evaluation
   - Ratio trends
   - Valuation methodologies

Tags to incorporate: Financial Analysis, Ratio and Trend Analysis, Portfolio Monitoring, Valuation

Output format:
- Output the outline as a JSON array of section objects.
- Each section object must include exactly one key for the section title (use the key "name") and one key for the section description.
- Keep original PDF section titles unchanged.
- Flag new sections with the "[Additional Analysis]" prefix.
- All section objects must be unique.
- IMPORTANT: Ensure that each section object has only one title value and no duplicate title keys.
- Create At most 10 sections
""",
    """
You are an expert market analyst. Based on the topic and combined content, produce a market sizing report outline.

Required PDF Sections (MUST INCLUDE VERBATIM):
{pdf_sections}

Additional Context:
Topic: {topic}
Document Context: {context}

Generate an outline that:
1. Retains all market data sections from the PDF unchanged.
2. Any new section should not be similar to the already provided sections in the PDF.
3. Expands the report with additional sections covering:
   - Market segmentation analysis
   - Key player benchmarking  
   - Growth trend projections
   - Competitive landscape
   - Emerging market dynamics

Tags to incorporate: Market Research, Business Consulting, Strategy, Marketing

Output format:
- Output the outline as a JSON array of section objects.
- Each section object must include exactly one key for the section title (use the key "name") and one key for the section description.
- Preserve original PDF section titles.
- Mark supplemental sections with the "[Extended Research]" prefix.
- All section objects must be unique.
- IMPORTANT: Each section must contain only one title field; do not output duplicate or multiple values for the section's title.
- Create At most 10 sections
""",
]

SECTION_WRITER_INSTRUCTIONS = [
    """You are an expert financial and industry analyst. Draft a very detailed and comprehensive content for the following section of an industry report based on the relevant document excerpts provided. Your content should directly address the data or questions implied by the section and include extended analysis, examples, and additional insights.
Section Title: {section_title}
Section Description: {section_topic}
Relevant Document Excerpts:
{context}
Ensure the analysis reflects deep insights into company management, business models, industry standing, financial performance, corporate actions, and news. Leverage the following tags for focus: Investment Research, Target Screening, Corporate Due Diligence, Competitive Research.
""",
    """You are an expert financial and industry analyst. Draft a very detailed and comprehensive content for the following section of an industry report based on the relevant document excerpts provided. Your content should directly address the data or questions implied by the section and include extended analysis, examples, and additional insights.
Section Title: {section_title}
Section Description: {section_topic}
Relevant Document Excerpts:
{context}
Ensure your analysis delves into financial health, key performance ratios, trend analysis, and valuation techniques. Leverage insights from the following tags: Financial Analysis, Ratio and Trend Analysis, Portfolio Monitoring, Valuation.
""",
    """You are an expert financial and industry analyst. Draft a very detailed and comprehensive content for the following section of an industry report based on the relevant document excerpts provided. Your content should directly address the data or questions implied by the section and include extended analysis, examples, and additional insights.
Section Title: {section_title}
Section Description: {section_topic}
Relevant Document Excerpts:
{context}
Ensure your analysis focuses on market size, segmentation, competitive landscape, and trend analysis. Leverage insights from the following tags: Market Research, Business Consulting, Strategy, Marketing.
""",
]

FINAL_SECTION_WRITER_INSTRUCTIONS = [
    """You are an expert financial and industry analyst. Compile the final sections of the industry report by synthesizing and polishing the content from all completed sections. Produce a comprehensive narrative report of at least 3000 words that includes thorough analysis, detailed examples, and extended insights.
Context from Completed Sections:
{context}
Generate the final, integrated content for the industry report, ensuring that the comprehensive company profile is clearly outlined with details on management, business models, industry position, financial performance, corporate actions, and news. Factor in the following tags: Investment Research, Target Screening, Corporate Due Diligence, Competitive Research.
""",
    """You are an expert financial and industry analyst. Compile the final sections of the industry report by synthesizing and polishing the content from all completed sections. Produce a comprehensive narrative report of at least 3000 words that includes thorough analysis, detailed examples, and extended insights.
Context from Completed Sections:
{context}
Generate the final, integrated content for the industry report, ensuring that the financial statement analysis is clearly outlined with detailed assessments of financial performance, ratios, trends, and valuation methodologies. Factor in the following tags: Financial Analysis, Ratio and Trend Analysis, Portfolio Monitoring, Valuation.
""",
    """You are an expert financial and industry analyst. Compile the final sections of the industry report by synthesizing and polishing the content from all completed sections. Produce a comprehensive narrative report of at least 3000 words that includes thorough analysis, detailed examples, and extended insights.
Context from Completed Sections:
{context}
Generate the final, integrated content for the industry report, ensuring that the market sizing aspects are clearly delineated with insights on market size, player segmentation, competitive trends, and strategic analysis. Factor in the following tags: Market Research, Business Consulting, Strategy, Marketing.
""",
]

QUERY_PROMPT_FOR_ITERATION = [
    """You are an expert financial analyst. Generate up to 3 refined queries to deepen research for this section, building on previous findings and addressing any gaps. Prioritize queries likely to return valuable new information.
    Section Context:
    Title: {section_title}
    Description: {description}

    Research History:
    Previous Queries Attempted:
    {previous_queries}
    Responses Received:
    {previous_responses}
    Feedback on Results:
    {feedback}

    Current Focus Areas:
    1. Management effectiveness and compensation alignment with performance
    2. Business model scalability and differentiation factors  
    3. Market share dynamics and competitive moat analysis
    4. Recent M&A activity and capital allocation decisions
    5. ESG factors impacting valuation

    Query Generation Guidelines:
    - Explicitly reference specific data points from previous responses that need expansion
    - Address any unanswered aspects from prior queries
    - Incorporate analyst feedback on missing/depth requirements
    - Maintain focus on: {tags}

    Format Requirements:
    For each query, specify:
    - Data source target (web/kb/excel)
    - Rationale for why this query will yield new insights
    - Connection to previous research thread""",
    """You are an expert financial analyst. Generate up to 3 precision queries to extract deeper financial insights, using prior results as foundation.
    Section Context:  
    Title: {section_title}
    Description: {description}

    Research History:
    Previous Queries Attempted:
    {previous_queries}  
    Responses Received:
    {previous_responses}
    Feedback on Results:
    {feedback}

    Current Focus Areas:
    1. Margin decomposition by product/geography
    2. Working capital cycle trends  
    3. Debt covenant compliance metrics
    4. Non-GAAP reconciliation analysis
    5. Forward-looking guidance accuracy

    Query Generation Guidelines:
    - Cross-reference specific financial metrics needing verification
    - Identify ratio correlations requiring explanation
    - Target periods with anomalous results
    - Incorporate: {tags}

    Format Requirements:
    For each query, specify:
    - Required dataset (income statement/balance sheet/cash flow)
    - Comparison timeframe requested
    - Specific calculation methodology if relevant""",
    """You are an expert market analyst. Develop 3 strategic queries to expand market understanding based on existing data.
    Section Context:
    Title: {section_title}
    Description: {description}

    Research History:
    Previous Queries Attempted:
    {previous_queries}
    Responses Received:  
    {previous_responses}
    Feedback on Results:
    {feedback}

    Current Focus Areas:
    1. TAM/SAM/SOM validation
    2. Customer acquisition cost trends
    3. Regulatory impact analysis  
    4. Technological disruption vectors
    5. Emerging market penetration strategies

    Query Generation Guidelines:
    - Benchmark against competitors mentioned in prior results
    - Identify geographic/service gaps in current data
    - Project growth rates using multiple scenarios  
    - Incorporate: {tags}

    Format Requirements:
    For each query, specify:
    - Geographic/segment specificity
    - Time horizon (historical/forward-looking)
    - Comparator requirements""",
]



