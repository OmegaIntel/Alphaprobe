import os
import asyncio
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi.responses import Response

# For token-based chunking
import tiktoken

# Import the new OpenAI client interface
from openai import OpenAI

pdf_report_router = APIRouter()

class ReportRequest(BaseModel):
    markdown: str
    title: str
    sub_title: str
    theme: str = "professional"

COLOR_SCHEMES = {
    "professional": {
        "primary": "#2C3E50",
        "secondary": "#34495E",
        "accent": "#3498DB",
        "text": "#2C3E50",
        "background": "#FFFFFF",
        "muted": "#95A5A6"
    },
    "modern": {
        "primary": "#1A237E",
        "secondary": "#0D47A1",
        "accent": "#2962FF",
        "text": "#212121",
        "background": "#FAFAFA",
        "muted": "#757575"
    }
}

BASE_HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root {{
            --primary: {primary};
            --secondary: {secondary};
            --accent: {accent};
            --text: {text};
            --background: {background};
            --muted: {muted};
        }}
        body {{
            font-family: 'Roboto', system-ui, sans-serif;
            line-height: 1.6;
            color: var(--text);
            background: var(--background);
            margin: 0;
            padding: 2rem;
        }}
        h1, h2, h3, h4, h5, h6 {{
            font-family: 'Open Sans', system-ui, sans-serif;
            color: var(--primary);
            margin-top: 2em;
            margin-bottom: 1em;
        }}
        .title {{
            color: var(--primary);
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            margin-top: 0;
        }}
        .subtitle {{
            color: var(--secondary);
            font-size: 1.5rem;
            margin-bottom: 2rem;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
        }}
        th, td {{
            border: 1px solid var(--muted);
            padding: 0.75rem;
            text-align: left;
        }}
        th {{
            background-color: var(--primary);
            color: white;
        }}
        tr:nth-child(even) {{
            background-color: rgba(0,0,0,0.05);
        }}
        code {{
            font-family: 'Courier New', monospace;
            background: #f4f4f4;
            padding: 0.2em 0.4em;
            border-radius: 3px;
        }}
        pre code {{
            display: block;
            padding: 1em;
            overflow-x: auto;
        }}
        blockquote {{
            border-left: 4px solid var(--accent);
            margin: 1rem 0;
            padding: 0.5rem 1rem;
            background: rgba(0,0,0,0.05);
        }}
        @media print {{
            body {{
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }}
            pre {{
                white-space: pre-wrap;
            }}
        }}
    </style>
    <script>
        mermaid.initialize({{ startOnLoad: true }});
    </script>
</head>
<body>
    <h1 class="title">{title}</h1>
    <h2 class="subtitle">{subtitle}</h2>
    <div class="content">
        {content}
    </div>
</body>
</html>
"""

# Create a global OpenAI client using the new interface.
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def chunk_text_tokens(
    text: str,
    chunk_token_size: int = 1500,
    overlap_token_size: int = 200,
    model_name: str = "gpt-3.5-turbo"
) -> list[str]:
    """
    Splits the text into overlapping chunks based on token counts,
    using the tiktoken library for accurate token-based segmentation.
    
    :param text: The full text to be chunked.
    :param chunk_token_size: Maximum number of tokens per chunk.
    :param overlap_token_size: Number of tokens to overlap between chunks.
    :param model_name: Model name for which we load the correct encoding.
    :return: A list of text chunks (each chunk is a string).
    """
    try:
        encoding = tiktoken.encoding_for_model(model_name)
    except KeyError:
        encoding = tiktoken.get_encoding("cl100k_base")

    tokens = encoding.encode(text)
    total_tokens = len(tokens)
    
    chunks = []
    start_idx = 0

    while start_idx < total_tokens:
        end_idx = min(start_idx + chunk_token_size, total_tokens)
        chunk_token_ids = tokens[start_idx:end_idx]
        chunk_str = encoding.decode(chunk_token_ids)
        chunks.append(chunk_str)
        start_idx += chunk_token_size - overlap_token_size
        if start_idx < total_tokens and start_idx + overlap_token_size > total_tokens:
            start_idx = total_tokens

    return chunks

async def process_chunk_with_context(previous_summary: str, current_chunk: str) -> str:
    """
    Converts one chunk of markdown into enriched HTML using the LLM,
    referencing the previous summary for context.
    
    The prompt now instructs the LLM to generate new, unique canvas elements for Chart.js
    and div elements for Mermaid diagrams, with explicit instructions on when to use:
      - Pie charts for segmentation percentages.
      - Line charts for growth/trend data.
      - Bar charts for year-by-year numerical data.
    """
    detailed_prompt = f"""
You are an expert web developer, content analyst, and creative HTML generator.
Your task is to analyze the following markdown content and produce a fully enriched HTML version.
Instead of simply converting the markdown to HTML, reimagine and enhance the content using the following guidelines:

1. **Content Analysis & Enhancement:**
   - Analyze the markdown and decide on the optimal structure for presenting the information.
   - If any section is ambiguous or missing elements, make reasonable assumptions and note them as HTML comments.
   - Feel free to rearrange, rephrase, or add additional contextual data to improve clarity.

2. **Headers, Text, and Sections:**
   - Convert markdown headers (using '#' symbols) into appropriate HTML <h1> to <h6> tags.
   - Organize the content into semantic sections using <section>, <article>, <header>, and <footer> as needed.
   - Ensure that the HTML is well-formatted and indented for readability.

3. **Lists, Blockquotes, and Code:**
   - Convert unordered and ordered lists into <ul> and <ol> with proper <li> elements.
   - Convert blockquotes (lines starting with '>') into <blockquote> elements.
   - Convert fenced code blocks into <pre><code> blocks.
     - If a code block is marked with "mermaid", wrap its content in a new <div class="mermaid"> element.

4. **Tables, Charts, and Diagrams:**
   - Convert markdown tables into HTML <table> elements with clear <thead> and <tbody> sections.
   - If numerical or structured data is detected:
       - Use a **pie chart** (with a new, uniquely identified <canvas> element) when segmentation percentages are present.
       - Use a **line chart** (with a new, uniquely identified <canvas> element) when growth or trend data is present.
       - Use a **bar chart** (with a new, uniquely identified <canvas> element) when year-by-year numerical data is provided.
   - For each chart, insert a new <canvas> element with a unique id (e.g., "chart1", "chart2", etc.) and include an inline <script> block that initializes the appropriate Chart.js chart with sample or inferred data.
   - If a process or flow is described, generate a new <div class="mermaid"> element with a unique id for a Mermaid diagram.
   - Ensure that if multiple charts or diagrams are needed, each is generated with a unique identifier.

5. **Images and Media:**
   - Convert markdown images into <img> tags with correct src and alt attributes.
   - Optionally, add captions or additional context to images.

6. **Additional Enhancements:**
   - Add extra annotations or visualizations that help emphasize key insights.
   - Ensure that the final HTML is semantic, responsive, and includes all required interactive elements.
   - **Important:** Return only the pure HTML (without markdown syntax or extra commentary) that belongs inside the <div class="content"> container.

7. **External Resources:**
   - Assume that external resources (Chart.js, Mermaid) are loaded via the CDN links in the base HTML template.

8. **Output Requirement:**
   - Return the complete, well-structured HTML code for the <div class="content"> container, including any new canvas or div elements for charts and diagrams.

---
PREVIOUS SUMMARY/CONTEXT:
{previous_summary}

MARKDOWN CONTENT FOR THIS CHUNK:
{current_chunk}
"""

    try:
        response = await asyncio.to_thread(
            lambda: client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a creative and expert web developer."},
                    {"role": "user", "content": detailed_prompt}
                ],
                model="gpt-4o-mini",  # or your preferred model
                temperature=0.1
            )
        )
        chunk_html = response.choices[0].message.content.strip()
        return chunk_html
    except Exception as e:
        print(f"[process_chunk_with_context] Error: {str(e)}")
        return f"<div>{current_chunk}</div>"

async def summarize_html(html_content: str) -> str:
    """
    Summarize the generated HTML content to serve as context for the next chunk.
    """
    prompt = f"""
Please provide a concise summary (1-2 sentences) of the following HTML content, focusing on key topics and structure:

{html_content}
"""
    try:
        response = await asyncio.to_thread(
            lambda: client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a concise summarizer."},
                    {"role": "user", "content": prompt}
                ],
                model="gpt-4o-mini",
                temperature=0.1
            )
        )
        summary = response.choices[0].message.content.strip()
        return summary
    except Exception as e:
        print(f"[summarize_html] Error: {str(e)}")
        return "No summary available."

async def generate_enhanced_html(
    markdown_text: str,
    title: str,
    sub_title: str,
    theme: str = "professional",
    chunk_token_size: int = 1500,
    overlap_token_size: int = 200
) -> str:
    """
    Splits the markdown into token-based chunks, processes each chunk with the LLM,
    maintains context using summaries, and finally combines the enriched HTML.
    """
    print(f"[generate_enhanced_html] Starting token-based enhanced HTML generation with theme: {theme}")
    colors = COLOR_SCHEMES.get(theme, COLOR_SCHEMES["professional"])

    chunks = chunk_text_tokens(
        text=markdown_text,
        chunk_token_size=chunk_token_size,
        overlap_token_size=overlap_token_size,
        model_name="gpt-4"
    )
    print(f"[generate_enhanced_html] Total chunks: {len(chunks)}")

    all_html_parts = []
    previous_summary = "No previous context."

    for i, chunk in enumerate(chunks):
        print(f"[generate_enhanced_html] Processing chunk {i+1}/{len(chunks)}")
        chunk_html = await process_chunk_with_context(previous_summary, chunk)
        all_html_parts.append(chunk_html)
        previous_summary = await summarize_html(chunk_html)

    final_content_html = "\n\n".join(all_html_parts)
    final_html = BASE_HTML_TEMPLATE.format(
        title=title,
        subtitle=sub_title,
        content=final_content_html,
        **colors
    )
    print(f"[generate_enhanced_html] Final HTML length: {len(final_html)} characters")
    return final_html

@pdf_report_router.post("/api/generate-pdf")
async def generate_pdf(report_req: ReportRequest):
    print(f"[generate_pdf] Received request for: {report_req.title}")
    try:
        enhanced_html = await generate_enhanced_html(
            markdown_text=report_req.markdown,
            title=report_req.title,
            sub_title=report_req.sub_title,
            theme=report_req.theme,
            chunk_token_size=1500,
            overlap_token_size=200
        )
        return Response(
            content=enhanced_html,
            media_type="text/html",
            headers={"Content-Type": "text/html; charset=utf-8"}
        )
    except Exception as e:
        print(f"[generate_pdf] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
