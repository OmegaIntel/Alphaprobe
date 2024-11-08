from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from pyvirtualdisplay import Display
import requests
import asyncio
import urllib.parse
from playwright.async_api import async_playwright

app = FastAPI()

class CompanyRequest(BaseModel):
    company_name: str

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

# uvicorn pitchbook:app --reload --host 0.0.0.0 --port 8401