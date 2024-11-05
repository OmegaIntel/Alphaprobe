
import re
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from pyvirtualdisplay import Display

def extract_linkedin_url(text):
    pattern = r'https?://(?:www\.)?linkedin\.com/[^ ]*'
    match = re.search(pattern, text)
    if match:
        url = match.group(0)
        if not url.endswith('/'):
            url += '/'
        return [url]
    return []

def extract_crunchbase_url(link):
    if link:
        pattern = r'https?://(?:www\.)?crunchbase\.com/[^ ]*'
        match = re.search(pattern, link)
        if match:
            url = match.group(0)
            if not url.endswith('/'):
                url += '/'
            return url
    return ''

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
        api_url = "https://api.perplexity.ai/chat/completions"
        headers = {
            "Authorization": "Bearer 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",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.1-sonar-small-128k-online",
            "messages": [
                {"role": "system", "content": """Extract company information and return only the JSON data without any markdown formatting, code blocks, or notes. Use this exact structure:
                [
                    {
                        "name": "",
                        "headquarters": "",
                        "industry": "",
                        "products": [],
                        "revenue": "",
                        "employees": "",
                        "founding_date": "",
                        "founders": [],
                        "ipo_date": "",
                        "manufacturing_locations": [],
                        "annual_capacity": "",
                        "ceo": "",
                        "ceo_rating": "",
                        "funding": "",
                        "acquisitions": "",
                        "investments": "",
                        "recent_updates": [
                            {
                                "date": "",
                                "update": ""
                            }
                        ],
                        "competitors": []
                    }
                ]
                Return only the JSON data with no additional text or formatting."""},
                {"role": "user", "content": f"Extract and format the following company information: {page_content}"}
            ],
            "max_tokens": 1500,
            "temperature": 0.1,
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