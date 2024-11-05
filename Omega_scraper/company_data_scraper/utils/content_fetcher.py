import re
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from pyvirtualdisplay import Display

def extract_linkedin_url(text):
    """
    Extracts a LinkedIn URL from the given text.

    Parameters:
    - text (str): The text to search for a LinkedIn URL.

    Returns:
    - list: A list containing the LinkedIn URL if found, or an empty list.
    """
    pattern = r'https?://(?:www\.)?linkedin\.com/[^ ]*'  # Regex pattern to match LinkedIn URLs
    match = re.search(pattern, text)  # Search for the pattern in the text
    if match:
        url = match.group(0)  # Get the matched URL
        if not url.endswith('/'):
            url += '/'  # Ensure the URL ends with a '/'
        return [url]  # Return as a list
    return []  # Return empty list if no match is found

def extract_crunchbase_url(link):
    """
    Extracts a Crunchbase URL from the given link.

    Parameters:
    - link (str): The link to search for a Crunchbase URL.

    Returns:
    - str: The Crunchbase URL if found, or an empty string.
    """
    if link:
        pattern = r'https?://(?:www\.)?crunchbase\.com/[^ ]*'  # Regex pattern to match Crunchbase URLs
        match = re.search(pattern, link)  # Search for the pattern in the link
        if match:
            url = match.group(0)  # Get the matched URL
            if not url.endswith('/'):
                url += '/'  # Ensure the URL ends with a '/'
            return url  # Return the matched URL
    return ''  # Return empty string if no match is found

def fetch_content(url):
    """
    Fetches the content of a webpage and extracts company information using an external API.

    Parameters:
    - url (str): The URL of the webpage to fetch content from.

    Returns:
    - dict: A dictionary containing the extracted content or None if an error occurs.
    """
    display = Display(visible=0, size=(1024, 768))  # Set up a virtual display for headless browsing
    display.start()
    options = webdriver.FirefoxOptions()
    options.add_argument("--headless")  # Run Firefox in headless mode
    driver = webdriver.Firefox(options=options)
    try:
        driver.get(url)  # Navigate to the specified URL
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "body")))  # Wait for the body to load
        page_content = driver.find_element(By.TAG_NAME, "body").text  # Extract the text from the body
        
        # API URL and headers for sending the extracted content to the external API
        api_url = "https://api.perplexity.ai/chat/completions"
        headers = {
            "Authorization": "Bearer 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",
            "Content-Type": "application/json"
        }
        
        # Payload for the API request with the extracted content
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

        # Send a POST request to the API with the payload and headers
        api_response = requests.post(api_url, json=payload, headers=headers)
        api_response.raise_for_status()  # Raise an error for bad responses
        json_response = api_response.json()  # Parse the JSON response
        content = json_response.get('choices', [{}])[0].get('message', {}).get('content', "")  # Extract the content
        
        return {"content": content}  # Return the extracted content as a dictionary
    except Exception as e:
        print(f"Error fetching content: {e}")  # Print any errors encountered
        return None  # Return None if an error occurs
    finally:
        driver.quit()  # Close the web driver
        display.stop()  # Stop the virtual display
