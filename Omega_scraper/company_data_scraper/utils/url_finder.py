import urllib.parse
from playwright.async_api import async_playwright

async def find_url(company_name, site):
    """
    Searches Google for a specific company name on a given site and returns the first link found.

    Parameters:
    - company_name (str): The name of the company to search for.
    - site (str): The domain of the site to limit the search to (e.g., "linkedin.com").

    Returns:
    - str: The URL of the first search result or None if not found.
    """
    # Create a search query by encoding the company name and specifying the site
    term = urllib.parse.quote_plus(f"{company_name} site:{site}")
    # Construct the Google search URL with the encoded query
    url = f"https://www.google.com/search?q={term}"

    async with async_playwright() as pw:
        # Launch a headless browser instance
        browser = await pw.chromium.launch(headless=True)
        # Open a new page in the browser
        page = await browser.new_page()
        # Navigate to the constructed Google search URL
        await page.goto(url, wait_until="domcontentloaded")

        try:
            # Find the first link that has an <h3> tag (search result) and get its href attribute
            link = await page.locator("a:has(h3)").first.evaluate('el => el.href')
            return link  # Return the found link
        except Exception as e:
            # If an error occurs (e.g., no link found), print the error message
            print(f"{site} URL not found for {company_name}: {e}")
            return None  # Return None if no link is found
        finally:
            # Ensure the browser is closed after the operation
            await browser.close()

async def find_linkedin_url(company_name):
    """Finds the LinkedIn URL for the specified company name."""
    return await find_url(company_name, "linkedin.com")

async def find_crunchbase_url(company_name):
    """Finds the Crunchbase URL for the specified company name."""
    return await find_url(company_name, "crunchbase.com")

async def find_owler_url(company_name):
    """Finds the Owler URL for the specified company name."""
    return await find_url(company_name, "owler.com")

async def find_pitchbook_url(company_name):
    """Finds the PitchBook URL for the specified company name."""
    return await find_url(company_name, "pitchbook.com")
