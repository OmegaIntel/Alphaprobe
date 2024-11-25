from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import asyncio
import json
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from pyvirtualdisplay import Display

# Initialize FastAPI application
app = FastAPI()

# Models
class URLInput(BaseModel):
    """Schema for LinkedIn company profile endpoint input."""
    url: str

class URLRequest(BaseModel):
    """Schema for PitchBook company profile endpoint input."""
    url: str

# Scrapy-related functions
async def run_scrapy_crawl(urls: list[str]) -> list[dict]:
    """
    Run the Scrapy crawler for extracting company profile data.

    Args:
        urls (list[str]): List of URLs to scrape.

    Returns:
        list[dict]: Parsed data from the Scrapy crawler.

    Raises:
        Exception: If the crawler fails or the output file is missing.
    """
    output_file = "company_profile_data.json"

    # Execute Scrapy as an asynchronous subprocess
    process = await asyncio.create_subprocess_exec(
        "scrapy",
        "crawl",
        "company_profile_scraper",
        "-a", f"urls={json.dumps(urls)}",
        "-O", output_file,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )

    stdout, stderr = await process.communicate()

    if process.returncode != 0:
        raise Exception(f"Scrapy crawl failed: {stderr.decode()}")

    # Validate and read the output file
    output_path = Path(output_file)
    if not output_path.exists():
        raise Exception(f"Output file {output_file} not found")

    with output_path.open('r') as file:
        data = json.load(file)

    return data

# Selenium-related functions
def fetch_content_with_selenium(url: str) -> dict:
    """
    Fetch webpage content using Selenium.

    Args:
        url (str): URL to fetch content from.

    Returns:
        dict: Content or error message.

    Raises:
        HTTPException: If the Selenium operation fails.
    """
    # Initialize a virtual display for headless browsing
    display = Display(visible=0, size=(1024, 768))
    display.start()

    options = webdriver.FirefoxOptions()
    options.add_argument("--headless")
    driver = webdriver.Firefox(options=options)

    try:
        # Load the webpage and wait for content to load
        driver.get(url)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        page_content = driver.find_element(By.TAG_NAME, "body").text
        return {"content": page_content}
    except Exception as e:
        return {"error": f"Error fetching content: {str(e)}"}
    finally:
        driver.quit()
        display.stop()

# API Endpoints
@app.post("/linkedin_company_profile/")
async def linkedin_company_profile(input_data: URLInput):
    """
    Endpoint to fetch LinkedIn company profile data using Scrapy.

    Args:
        input_data (URLInput): URL for the company profile.

    Returns:
        dict: The first company profile data or error message.
    """
    try:
        company_urls = [input_data.url]
        data = await run_scrapy_crawl(company_urls)

        if not data:
            raise HTTPException(status_code=404, detail="No data found")

        return data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pitchbook_company_profile/")
def pitchbook_company_profile(request: URLRequest):
    """
    Endpoint to fetch PitchBook company profile data using Selenium.

    Args:
        request (URLRequest): URL for the company profile.

    Returns:
        dict: Webpage content or error message.
    """
    result = fetch_content_with_selenium(request.url)

    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result
