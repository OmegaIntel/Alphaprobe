from fastapi import FastAPI, HTTPException
import json
import subprocess
import asyncio
import urllib.parse
import re
from playwright.async_api import async_playwright

app = FastAPI()

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
            return link  # Return the link found
        except Exception as e:
            print(f"{site} URL not found for {company_name}: {e}")
            return None  # Return None if not found
        finally:
            await browser.close()  # Ensure the browser closes

async def find_linkedin_url(company_name):
    return await find_url(company_name, "linkedin.com")

def extract_linkedin_url(text):
    # Regular expression pattern to find LinkedIn URLs
    pattern = r'https?://(?:www\.)?linkedin\.com/[^ ]*'
    match = re.search(pattern, text)
    if match:
        url = match.group(0)
        # Ensure the URL ends with a '/'
        if not url.endswith('/'):
            url += '/'
        return [url]  # Return the URL as a list
    return []  # Return an empty list if not found

@app.get("/linkedin_company_profile")
async def get_company_profile(company_name: str):
    # Find LinkedIn URL
    url_str = await find_linkedin_url(company_name)
    company_urls = extract_linkedin_url(url_str)

    if not company_urls:
        raise HTTPException(status_code=404, detail="LinkedIn URL not found")

    # Run the Scrapy crawler with URLs passed as arguments
    subprocess.run(["scrapy", "crawl", "company_profile_scraper", "-a", f"urls={json.dumps(company_urls)}", "-O", "company_profile_data.json"])

    # Read and return the scraped data
    try:
        with open("company_profile_data.json") as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Failed to retrieve company profile data")

# uvicorn linkedin:app --reload --host 0.0.0.0 --port 8401
