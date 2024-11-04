import urllib.parse
from playwright.async_api import async_playwright


async def find_company_url(company_name: str, site: str):
    """Lookup company info page on the site using company_name and Google search."""

    term = urllib.parse.quote_plus(f"{company_name} site:{site}")
    url = f"https://www.google.com/search?q={term}"

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url, wait_until="domcontentloaded")

        try:
            # Retrieve the first result link for the specified site
            link = await page.locator("a:has(h3)").first.evaluate('el => el.href')
            return link
        except Exception as e:
            print(f"{site} URL not found for {company_name}: {e}")
        
        await browser.close()
