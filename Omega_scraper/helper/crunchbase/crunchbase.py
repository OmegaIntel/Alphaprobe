import asyncio
import urllib.parse
from fastapi import FastAPI, HTTPException
from playwright.async_api import async_playwright
import re
from firecrawl import FirecrawlApp

app = FastAPI()
firecrawl_app = FirecrawlApp(api_key='fc-f0b5a990147f4ae88364925cd0dee335')

async def find_url(company_name, site):
    term = urllib.parse.quote_plus(f"{company_name} site:{site}")
    url = f"https://www.google.com/search?q={term}"

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url, wait_until="domcontentloaded")

        try:
            # Retrieve the first result link for the specified site
            link = await page.locator("a:has(h3)").first.evaluate('el => el.href')
            return link  # Return the link instead of printing it
        except Exception as e:
            print(f"{site} URL not found for {company_name}: {e}")
            return None  # Return None if link not found
        finally:
            await browser.close()

async def find_crunchbase_url(company_name):
    return await find_url(company_name, "crunchbase.com")

def extract_crunchbase_url(link):
    if link:
        pattern = r'https?://(?:www\.)?crunchbase\.com/[^ ]*'
        match = re.search(pattern, link)
        if match:
            url = match.group(0)
            # Ensure the URL ends with a '/'
            if not url.endswith('/'):
                url += '/'
            return url  # Return the URL
    return ''  # Return an empty string if not found

@app.post("/fetch-crunchbase-url/")
async def fetch_crunchbase_url(company_name: str):
    link = await find_crunchbase_url(company_name)
    if not link:
        raise HTTPException(status_code=404, detail="Crunchbase URL not found.")

    extracted_url = extract_crunchbase_url(link)
    if not extracted_url:
        raise HTTPException(status_code=404, detail="No valid URL extracted.")

    # Scrape the extracted URL using Firecrawl
    response = firecrawl_app.scrape_url(url=extracted_url, params={
        'formats': ['markdown'],
    })

    return {
        "company_name": company_name,
        "crunchbase_url": extracted_url,
        "scrape_response": response
    }
