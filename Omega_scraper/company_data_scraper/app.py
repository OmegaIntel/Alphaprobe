from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import json
import subprocess
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from pyvirtualdisplay import Display
from firecrawl import FirecrawlApp
from uuid import uuid1
from os import unlink

app = FastAPI()

# Initialize Firecrawl App with API key
firecrawl_app = FirecrawlApp(api_key='fc-f0b5a990147f4ae88364925cd0dee335')

class CompanyRequest(BaseModel):
    company_url: str


@app.post("/linkedin-company-profile")
async def get_company_profile(request: CompanyRequest):
    # Find LinkedIn URL
    urls = [request.company_url]
    
    TEMP_FILE = f"{uuid1()}.json"

    # Run the Scrapy crawler with URLs passed as arguments
    subprocess.run(["scrapy", "crawl", "company_profile_scraper", "-a", f"urls={json.dumps(urls)}", "-O", TEMP_FILE])

    # Read and return the scraped data
    try:
        with open(TEMP_FILE) as f:
            data = json.load(f)
        unlink(TEMP_FILE)
        return data
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve company profile data from {urls}")


@app.post("/crunchbase-company-profile")
async def fetch_crunchbase_url(request: CompanyRequest):
    url = request.company_url

    # Scrape the extracted URL using Firecrawl
    response = firecrawl_app.scrape_url(url=url, params={
        'formats': ['markdown'],
    })

    return {
        "crunchbase_url": url,
        "scrape_response": response
    }


# Function to fetch content with Selenium
def fetch_content(url: str) -> dict:
    display = Display(visible=0, size=(1024, 768))
    display.start()

    options = webdriver.FirefoxOptions()
    options.add_argument("--headless")
    driver = webdriver.Firefox(options=options)

    try:
        driver.get(url)
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        page_content = driver.find_element(By.TAG_NAME, "body").text
        return {"content": page_content}
    except Exception as e:
        print(f"Error fetching content: {e}")
        return {}

    finally:
        driver.quit()
        display.stop()


@app.post("/owler-company-profile")
@app.post("/pitchbook-company-profile")
async def fetch_company_info(request: CompanyRequest):
    url = request.company_url
    content = fetch_content(url)
    if not content:
        raise HTTPException(status_code=500, detail="Error fetching content from URL")
    return content


# uvicorn app:app --workers 24 --reload --host 0.0.0.0 --port 8401
# fastapi run --workers 16 --reload --port 8401 app.py