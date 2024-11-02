from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import asyncio
import json
import re
import urllib.parse
import requests
import subprocess
from playwright.async_api import async_playwright
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from pyvirtualdisplay import Display
from firecrawl import FirecrawlApp

app = FastAPI()

# Initialize Firecrawl App with API key
firecrawl_app = FirecrawlApp(api_key='fc-f0b5a990147f4ae88364925cd0dee335')

class CompanyRequest(BaseModel):
    company_name: str


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

@app.post("/linkedin-company-profile")
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

@app.post("/fetch-crunchbase-profile/")
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




# Function to find URL with Playwright
async def find_url(company_name, site):
    term = urllib.parse.quote_plus(f"{company_name} site:{site}")
    url = f"https://www.google.com/search?q={term}"

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url, wait_until="domcontentloaded")

        try:
            link = await page.locator("a:has(h3)").first.evaluate('el => el.href')
            return link
        except Exception as e:
            print(f"{site} URL not found for {company_name}: {e}")
            return None
        finally:
            await browser.close()

# Wrapper to fetch Owler URL
async def find_owler_url(company_name):
    return await find_url(company_name, "owler.com")

# Function to fetch content with Selenium
def fetch_content(url):
    display = Display(visible=0, size=(1024, 768))
    display.start()

    options = webdriver.FirefoxOptions()
    options.add_argument("--headless")
    driver = webdriver.Firefox(options=options)

    try:
        driver.get(url)
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        page_content = driver.find_element(By.TAG_NAME, "body").text

        # Prepare API call to Perplexity
        api_url = "https://api.perplexity.ai/chat/completions"
        headers = {
            "Authorization": "Bearer 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",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.1-sonar-small-128k-online",
            "messages": [
                {"role": "system", "content": "Be precise and concise."},
                {"role": "user", "content": f"Organize and extract relevant info from the following response: {page_content}"}
            ],
            "max_tokens": 1500,
            "temperature": 0.2,
            "top_p": 0.9
        }

        api_response = requests.post(api_url, json=payload, headers=headers)
        api_response.raise_for_status()
        json_response = api_response.json()
        content = json_response.get('choices', [{}])[0].get('message', {}).get('content', "")
        return {"content": content}

    except Exception as e:
        print(f"Error fetching content: {e}")
        return None

    finally:
        driver.quit()
        display.stop()

# FastAPI route
@app.post("/owler_company_profile")
async def fetch_company_info(request: CompanyRequest):
    company_name = request.company_name
    url = await find_owler_url(company_name)

    if not url:
        raise HTTPException(status_code=404, detail="Company URL not found")

    content = fetch_content(url)
    if not content:
        raise HTTPException(status_code=500, detail="Error fetching content from URL")

    return content

# Function to find URL with Playwright
async def find_url(company_name, site):
    term = urllib.parse.quote_plus(f"{company_name} site:{site}")
    url = f"https://www.google.com/search?q={term}"

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url, wait_until="domcontentloaded")

        try:
            link = await page.locator("a:has(h3)").first.evaluate('el => el.href')
            return link
        except Exception as e:
            print(f"{site} URL not found for {company_name}: {e}")
            return None
        finally:
            await browser.close()

# Wrapper to fetch Pitchbook URL
async def find_pitchbook_url(company_name):
    return await find_url(company_name, "pitchbook.com")

# Function to fetch content with Selenium
def fetch_content(url):
    display = Display(visible=0, size=(1024, 768))
    display.start()

    options = webdriver.FirefoxOptions()
    options.add_argument("--headless")
    driver = webdriver.Firefox(options=options)

    try:
        driver.get(url)
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        page_content = driver.find_element(By.TAG_NAME, "body").text

        # Prepare API call to Perplexity
        api_url = "https://api.perplexity.ai/chat/completions"
        headers = {
            "Authorization": "Bearer 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",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.1-sonar-small-128k-online",
            "messages": [
                {"role": "system", "content": "Be precise and concise."},
                {"role": "user", "content": f"Organize and extract relevant info from the following response: {page_content}"}
            ],
            "max_tokens": 1500,
            "temperature": 0.2,
            "top_p": 0.9
        }

        api_response = requests.post(api_url, json=payload, headers=headers)
        api_response.raise_for_status()
        json_response = api_response.json()
        content = json_response.get('choices', [{}])[0].get('message', {}).get('content', "")
        return {"content": content}

    except Exception as e:
        print(f"Error fetching content: {e}")
        return None

    finally:
        driver.quit()
        display.stop()

# FastAPI route
@app.post("/pitchbook_company_profile")
async def fetch_company_info(request: CompanyRequest):
    company_name = request.company_name
    url = await find_pitchbook_url(company_name)

    if not url:
        raise HTTPException(status_code=404, detail="Company URL not found")

    content = fetch_content(url)
    if not content:
        raise HTTPException(status_code=500, detail="Error fetching content from URL")

    return content

# uvicorn app:app --reload --host 0.0.0.0 --port 8401