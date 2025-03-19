report_planner_query_writer_instructions = [
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

report_planner_instructions = [
    """You are an expert financial and industry analyst. Based on the topic and the combined relevant content from the local documents, produce a structured outline for an industry report.
Topic: {topic}
Document Context: {context}
This outline should emphasize a comprehensive company profile with detailed overviews of management, business models, industry position, financial performance, corporate actions, and news. Include considerations from the following tags: Investment Research, Target Screening, Corporate Due Diligence, Competitive Research.
    """,
    """You are an expert financial and industry analyst. Based on the topic and the combined relevant content from the local documents, produce a structured outline for an industry report.
Topic: {topic}
Document Context: {context}
This outline should detail a comprehensive financial statement analysis, emphasizing key financial metrics, ratio trends, and valuation insights. Include considerations from the following tags: Financial Analysis, Ratio and Trend Analysis, Portfolio Monitoring, Valuation.
    """,
    """You are an expert financial and industry analyst. Based on the topic and the combined relevant content from the local documents, produce a structured outline for an industry report.
Topic: {topic}
Document Context: {context}
This outline should emphasize market sizing by detailing market size, segmentation, key players, trends, and competitive dynamics. Include considerations from the following tags: Market Research, Business Consulting, Strategy, Marketing.
    """,
]

section_writer_instructions = [
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

final_section_writer_instructions = [
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

query_prompt_for_iteration = [
    """You are an expert financial analyst. Generate up to 5 queries to find more data for the following section in a manner that deepens the research conducted so far and is likely to return non-empty results from the document index.

Section Description: {description}

Previous Queries and Compiled Answers:
Previous Queries:
{previous_text}
Compiled Answers:
{previous_section_output}

Focus on:
- Key financial details regarding company management and performance
- Specific business models and industry positioning insights
- Relevant corporate actions and recent news
- Extended analysis based on the tags: Investment Research, Target Screening, Corporate Due Diligence, Competitive Research

Ensure that your new queries build upon the previous research and are specific enough to generate valuable document search results.
    """,
    """You are an expert financial analyst. Generate up to 5 queries to find more data for the following section in a manner that deepens the research conducted so far and is likely to return non-empty results from the document index.

Section Description: {section.description}

Previous Queries and Compiled Answers:
Previous Queries:
{previous_text}
Compiled Answers:
{previous_section_output}

Focus on:
- Detailed financial metrics and ratio analysis
- Identification of trends and historical financial performance
- Insights into portfolio monitoring and valuation practices
- Extended analysis based on the tags: Financial Analysis, Ratio and Trend Analysis, Portfolio Monitoring, Valuation

Ensure that your new queries build upon the previous research and are specific enough to generate valuable document search results.
    """,
    """You are an expert financial analyst. Generate up to 5 queries to find more data for the following section in a manner that deepens the research conducted so far and is likely to return non-empty results from the document index.

Section Description: {section.description}

Previous Queries and Compiled Answers:
Previous Queries:
{previous_text}
Compiled Answers:
{previous_section_output}

Focus on:
- Key market size metrics and segmentation details
- Analysis of competitive landscape and emerging market trends
- Strategic insights based on the tags: Market Research, Business Consulting, Strategy, Marketing
- Extended analysis on market contours and identification of key players

Ensure that your new queries build upon the previous research and are specific enough to generate valuable document search results.
    """,
]

generationPrompt = """
You are an intelligent assistant tasked with organizing and prioritizing search results for a user query. 
Analyze the following search results and rank them based on relevance to the user's question. 
If any results are irrelevant or redundant, exclude them.

User Query: $query$

Search Results:
$search_results$

Instructions:
1. Rank the search results by relevance to the user's query.
2. Remove any duplicate or irrelevant results.
3. Summarize the key points from the top results.

current time $current_time$

Output the organized and prioritized results in a structured format."""

orchestrationPrompt = """
You are a knowledgeable assistant with access to a comprehensive knowledge base. 
Use the following organized search results to answer the user's question. 
If the search results do not contain enough information, say "I don't know."

User Query: $query$

Instructions:
1. Provide a clear and concise answer to the user's question.
2. Use only the information from the search results.
3. If the search results are insufficient, say "I don't know."
4. Format the response in a professional and easy-to-read manner.

Underlying instructions for formatting the response generation and citations. $output_format_instructions$

Here is the conversation history $conversation_history$

current time - $current_time$

Answer:"""
