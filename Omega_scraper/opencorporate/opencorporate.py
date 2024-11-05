import os
import time
import csv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup

app = FastAPI()

# Account details for login
account = {"USERNAME": 'chaitanyagoel19@gmail.com', "PASSWORD": 'fTUgzJV6*A6szT_'}

class CompanyURL(BaseModel):
    url: str

def login_auth(browser):
    page = browser.new_page()
    page.goto("https://opencorporates.com/users/sign_in")
    page.wait_for_load_state("domcontentloaded")

    page.wait_for_selector("#user_email", timeout=60000)  # Wait for the email field to be visible
    page.fill("#user_email", account["USERNAME"])
    page.fill("#user_password", account["PASSWORD"])
    page.click("button[name='submit']")
    page.wait_for_timeout(10000)  # Wait for 10 seconds

    return page

def get_company_details(page, url):
    try:
        page.goto(url)
        page.wait_for_timeout(10000)

        html = page.content()
        soup = BeautifulSoup(html, 'html.parser')

        company_name = soup.select_one('h1.wrapping_heading.fn.org').get_text(strip=True) if soup.select_one('h1.wrapping_heading.fn.org') else "N/A"
        company_number = soup.select_one('dd.company_number').get_text(strip=True) if soup.select_one('dd.company_number') else "N/A"
        status = soup.select_one('dd.status').get_text(strip=True) if soup.select_one('dd.status') else "N/A"
        incorporation_date = soup.select_one('dd.incorporation_date').get_text(strip=True) if soup.select_one('dd.incorporation_date') else "N/A"
        company_type = soup.select_one('dd.company_type').get_text(strip=True) if soup.select_one('dd.company_type') else "N/A"
        jurisdiction = soup.select_one('dd.jurisdiction').get_text(strip=True) if soup.select_one('dd.jurisdiction') else "N/A"
        agent_name = soup.select_one('dd.agent_name').get_text(strip=True) if soup.select_one('dd.agent_name') else "N/A"
        agent_address = soup.select_one('dd.agent_address').get_text(strip=True) if soup.select_one('dd.agent_address') else "N/A"

        address_div = soup.find('div', {'id': 'company_addresses'})
        if address_div:
            addresses = address_div.select('p.description')
            head_office_address = addresses[0].get_text(strip=True) if len(addresses) > 0 else "N/A"
            mailing_address = addresses[1].get_text(strip=True) if len(addresses) > 1 else "N/A"
            second_head_office_address = addresses[2].get_text(strip=True) if len(addresses) > 2 else "N/A"
        else:
            head_office_address = mailing_address = second_head_office_address = "N/A"

        phone_div = soup.find('div', {'id': 'telephone_numbers'})
        if phone_div:
            phone_numbers = phone_div.select('p.description')
            phone_number = phone_numbers[0].get_text(strip=True) if len(phone_numbers) > 0 else "N/A"
        else:
            phone_number = "N/A"
        
        return {
            "Company Name": company_name,
            "Company Number": company_number,
            "Status": status,
            "Incorporation Date": incorporation_date,
            "Company Type": company_type,
            "Jurisdiction": jurisdiction,
            "Agent Name": agent_name,
            "Agent Address": agent_address,
            "Head Office Address": head_office_address,
            "Mailing Address": mailing_address,
            "Second Head Office Address": second_head_office_address,
            "Phone Number": phone_number,
            "Company URL": url
        }
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return None

@app.post("/openCorprate_company_profile/")
def fetch_company_details(company_url: CompanyURL):
    with sync_playwright() as p:
        # Launch the browser without a proxy
        browser = p.chromium.launch(headless=True)
        page = login_auth(browser)

        print(f"Fetching details for: {company_url.url} using account: {account['USERNAME']}")

        # Fetch the company details
        company_details = get_company_details(page, company_url.url)
        
        if company_details:
            browser.close()
            return company_details
        else:
            browser.close()
            raise HTTPException(status_code=404, detail="Company details not found.")

## uvicorn opencorporate:app --reload --host 0.0.0.0 --port 8501

# import asyncio
# import urllib.parse
# from playwright.async_api import async_playwright
# import re

# async def find_url(company_name, site):
#     term = urllib.parse.quote_plus(f"{company_name} site:{site}")
#     url = f"https://www.google.com/search?q={term}"

#     async with async_playwright() as pw:
#         browser = await pw.chromium.launch(headless=True)
#         page = await browser.new_page()
#         await page.goto(url, wait_until="domcontentloaded")

#         try:
#             # Retrieve the first result link for the specified site
#             link = await page.locator("a:has(h3)").first.evaluate('el => el.href')
#             return link  # Return the link instead of printing it
#         except Exception as e:
#             print(f"{site} URL not found for {company_name}: {e}")
#             return None  # Return None if link not found
        
#         await browser.close()

# async def find_opencorporate_url(company_name):
#     return await find_url(company_name, "opencorporates.com")

# # Use asyncio to run the async function
# company_name = "JP MORGAN CHASE BANK"
# link = asyncio.run(find_opencorporate_url(company_name))

# def extract_opencorporate_url(link):
#     if link:
#         pattern = r'https?://(?:www\.)?opencorporates\.com/[^ ]*'
#         match = re.search(pattern, link)
#         if match:
#             url = match.group(0)
#             # Ensure the URL ends with a '/'
#             if not url.endswith('/'):
#                 url += '/'
#             return url # Return the URL as a list
#     return '' # Return an empty list if not found

# # Print the extracted URL list
# print(extract_opencorporate_url(link))

