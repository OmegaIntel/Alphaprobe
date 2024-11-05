import urllib.parse
from playwright.async_api import async_playwright

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

async def find_linkedin_url(company_name):
    return await find_url(company_name, "linkedin.com")

async def find_crunchbase_url(company_name):
    return await find_url(company_name, "crunchbase.com")

async def find_owler_url(company_name):
    return await find_url(company_name, "owler.com")

async def find_pitchbook_url(company_name):
    return await find_url(company_name, "pitchbook.com")