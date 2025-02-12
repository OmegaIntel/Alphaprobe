import os
import asyncio
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi.responses import Response

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

async def generate_enhanced_html(markdown_text: str, title: str, sub_title: str, theme: str = "professional") -> str:
    print(f"[generate_enhanced_html] Starting enhanced HTML generation with theme: {theme}")
    colors = COLOR_SCHEMES.get(theme, COLOR_SCHEMES["professional"])
    
    detailed_prompt = f"""
You are an expert web developer, content analyst, and creative HTML generator. Your task is to analyze the following markdown content and produce a fully enriched HTML version. Instead of simply converting the markdown to HTML, reimagine and enhance the content with the following features:

1. **Content Analysis & Enhancement:**
   - Analyze the provided markdown and decide on the best structure for presenting the information.
   - If any section is ambiguous or missing expected elements, make reasonable assumptions and document them as HTML comments.
   - Feel free to rearrange, rephrase, or add additional contextual data if it improves clarity.

2. **Headers, Text, and Sections:**
   - Convert markdown headers (using '#' symbols) into appropriate HTML <h1> to <h6> tags.
   - Organize the content into semantic sections using elements like <section>, <article>, <header>, and <footer> as appropriate.
   - Ensure the HTML is well-formatted with proper indentation for readability.

3. **Lists, Blockquotes, and Code:**
   - Convert unordered and ordered lists into <ul> and <ol> elements with proper <li> tags.
   - Convert blockquotes (lines starting with '>') into <blockquote> elements.
   - Convert fenced code blocks into <pre><code> blocks.
     - If a code block is marked with "mermaid", wrap its content in a <div class="mermaid">...</div> block for Mermaid diagrams.

4. **Tables and Interactive Charts:**
   - Convert markdown tables into HTML <table> elements with clearly defined <thead> and <tbody> sections.
   - If a table contains numerical data, after the table insert a <canvas> element with a unique id (e.g., "chart1") and include an inline <script> block that initializes a Chart.js bar chart using the table data.
     - For example:
     ```
     <canvas id="chart1"></canvas>
     <script>
       const ctx = document.getElementById('chart1').getContext('2d');
       new Chart(ctx, {{
         "type": "bar",
         "data": {{
           "labels": ["Label1", "Label2", "Label3"],
           "datasets": [{{ 
             "label": "Dataset 1",
             "data": [10, 20, 30],
             "backgroundColor": "rgba(52, 152, 219, 0.5)",
             "borderColor": "rgba(41, 128, 185, 1)",
             "borderWidth": 1
           }}]
         }},
         "options": {{ "responsive": true }}
       }});
     </script>
     ```
   - You may transform, aggregate, or supplement table data to improve visualization.

5. **Images and Media:**
   - Convert markdown images into <img> tags with proper src and alt attributes.
   - Optionally, enhance image presentation by adding captions or additional context.

6. **Additional Enhancements:**
   - Feel free to add any extra data, charts, or annotations to highlight key insights.
   - Ensure the final HTML is semantic, responsive, and includes all required interactive elements.
   - **Important:** Return pure HTML without any markdown syntax, code fences, or extraneous commentary.

7. **External Resources:**
   - Assume that external resources (Chart.js, Mermaid) are loaded via the CDN links provided in the HTML template.

8. **Output Requirement:**
   - Return only the complete HTML code that belongs inside the <div class="content"> container.
   - Ensure the final HTML is clean, well-structured, and uses modern HTML5 practices.

Markdown content:
{markdown_text}
"""
    try:
        print("[generate_enhanced_html] Sending detailed prompt to OpenAI GPT-4o mini...")
        # Run the synchronous OpenAI call in a separate thread
        response = await asyncio.to_thread(
            lambda: client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a creative and expert web developer."},
                    {"role": "user", "content": detailed_prompt}
                ],
                model="gpt-4o-mini",
                temperature=0.1
            )
        )
        content_html = response.choices[0].message.content.strip()
        
        final_html = BASE_HTML_TEMPLATE.format(
            title=title,
            subtitle=sub_title,
            content=content_html,
            **colors
        )
        
        print(f"[generate_enhanced_html] Generated HTML length: {len(final_html)} characters")
        return final_html
    except Exception as e:
        print(f"[generate_enhanced_html] Error: {str(e)}")
        # Fallback to basic HTML if generation fails
        return BASE_HTML_TEMPLATE.format(
            title=title,
            subtitle=sub_title,
            content=f"<div>{markdown_text}</div>",
            **colors
        )

@pdf_report_router.post("/api/generate-pdf")
async def generate_pdf(report_req: ReportRequest):
    print(f"[generate_pdf] Received request for: {report_req.title}")
    try:
        enhanced_html = await generate_enhanced_html(
            markdown_text=report_req.markdown,
            title=report_req.title,
            sub_title=report_req.sub_title,
            theme=report_req.theme
        )
        return Response(
            content=enhanced_html,
            media_type="text/html",
            headers={"Content-Type": "text/html; charset=utf-8"}
        )
    except Exception as e:
        print(f"[generate_pdf] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
