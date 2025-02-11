import os
import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi.responses import Response
from llama_index.llms.openai import OpenAI
from llama_index.core import Settings
import pdfkit


pdf_report_router = APIRouter()

class ReportRequest(BaseModel):
    markdown: str
    title: str
    sub_title: str
    theme: str = "professional"  # Can be: professional, modern, classic, technical

def setup_llm():
    return OpenAI(
        model="gpt-4",
        temperature=0.1,
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )

async def generate_enhanced_html(markdown_text: str, title: str, sub_title: str, theme: str = "professional") -> str:
    llm = setup_llm()
    
    color_schemes = {
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
    
    colors = color_schemes.get(theme, color_schemes["professional"])
    
    prompt = f"""You are an expert document analyst and formatting specialist. Your task is to analyze the provided markdown content and convert it into a professionally styled HTML document with advanced formatting and visualizations.

ANALYSIS PHASE:
1. Analyze the content structure and identify:
   - Main sections and subsections
   - Key data points for tables
   - Information that could be visualized (charts, diagrams)
   - Important quotes or callouts
   - Statistical data
   - Process flows or sequences
   - Comparative data
   - Hierarchical relationships

2. Enhancement Requirements:
   - Convert basic tables into professionally styled responsive tables
   - Create Mermaid diagrams for:
     * Process flows (flowchart)
     * Sequences (sequence diagram)
     * Hierarchies (mindmap)
   - Add appropriate icons for different section types
   - Include data visualizations where relevant
   - Format quotes and callouts distinctively
   - Use appropriate heading hierarchy
   - Include a dynamic table of contents

FORMATTING SPECIFICATIONS:

HTML Structure:
- Use semantic HTML5 elements
- Include meta viewport tag for responsiveness
- Implement proper document outline
- Include smooth scrolling

CSS Styling:
- Use the following color scheme:
  * Primary: {colors['primary']}
  * Secondary: {colors['secondary']}
  * Accent: {colors['accent']}
  * Text: {colors['text']}
  * Background: {colors['background']}
  * Muted: {colors['muted']}
- Implement consistent typography:
  * Headings: 'Open Sans' or system-ui
  * Body: 'Roboto' or system-ui
  * Monospace: 'JetBrains Mono' or monospace
- Add subtle animations for interactivity
- Use CSS Grid for layout
- Implement proper spacing and vertical rhythm
- Include print-specific styles

Visual Elements:
- Convert bullet points into visual elements where appropriate
- Add progress bars for percentages
- Include appropriate icons (using HTML entities or SVG)
- Style blockquotes with modern design
- Create visually appealing tables
- Add subtle shadows and depth

Advanced Features:
- Generate Mermaid diagrams for processes and flows
- Create responsive data tables
- Style code blocks with syntax highlighting
- Add footnotes with hover explanations
- Include a floating table of contents
- Generate appropriate charts using Chart.js

CONTENT TO PROCESS:
Title: {title}
Subtitle: {sub_title}
Markdown Content:
{markdown_text}

Return a complete HTML document with embedded CSS and any necessary JavaScript. Include all styling and scripts inline to ensure proper PDF generation. Add appropriate Mermaid diagrams, charts, and visualizations based on the content analysis.

For charts and diagrams:
- Use Mermaid syntax for process flows and sequences
- Use Chart.js for data visualizations
- Ensure all diagrams have proper titles and legends
- Use the specified color scheme consistently

For tables:
- Add zebra striping
- Include hover effects
- Make them responsive
- Add sorting capabilities where appropriate

For code blocks:
- Add syntax highlighting
- Include copy buttons
- Show language indicators
- Use a monospace font

For text content:
- Add appropriate line height (1.6)
- Ensure proper paragraph spacing
- Style lists with custom bullets
- Include block quotes with distinctive styling

Remember to:
1. Analyze the content first to identify visualization opportunities
2. Use the color scheme consistently
3. Ensure all interactive elements work in PDF format
4. Include print-specific CSS
5. Add page breaks where appropriate
6. Ensure proper heading hierarchy
"""

    response = await llm.acomplete(prompt)
    return response.text

async def convert_html_to_pdf(html_content: str) -> bytes:
    def pdf_conversion(html: str) -> bytes:
        options = {
            'page-size': 'A4',
            'margin-top': '0.75in',
            'margin-right': '0.75in',
            'margin-bottom': '0.75in',
            'margin-left': '0.75in',
            'encoding': 'UTF-8',
            'enable-local-file-access': None,
            'javascript-delay': '1000',  # Wait for JavaScript execution
            'no-stop-slow-scripts': None,
            'enable-javascript': None,
            'enable-smart-shrinking': None,
            'print-media-type': None,
            'enable-local-file-access': None,
            'header-font-size': '9',
            'footer-font-size': '9',
            'header-spacing': '5',
            'footer-spacing': '5',
            'header-right': '[page] of [topage]',
            'footer-left': title,
            'footer-right': datetime.now().strftime('%Y-%m-%d'),
            'quiet': None
        }
        return pdfkit.from_string(html, output_path=False, options=options)
    
    pdf_bytes = await asyncio.to_thread(pdf_conversion, html_content)
    return pdf_bytes

@pdf_report_router.post("/generate-pdf")
async def generate_pdf(report_req: ReportRequest):
    try:
        enhanced_html = await generate_enhanced_html(
            markdown_text=report_req.markdown,
            title=report_req.title,
            sub_title=report_req.sub_title,
            theme=report_req.theme
        )
        
        pdf_bytes = await convert_html_to_pdf(enhanced_html)
        
        filename = f"{report_req.title.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))