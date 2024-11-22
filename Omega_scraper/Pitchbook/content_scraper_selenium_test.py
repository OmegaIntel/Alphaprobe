import time
import random
import pandas as pd
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from pyvirtualdisplay import Display
from fake_useragent import UserAgent

# Load URLs from CSV
input_file = "combined_material&resource.csv"  # Replace with your CSV file name
output_file = "scraper_results.csv"  # New CSV file to save the results
blockage_report_file = "blockage_report.csv"  # File to save blocked URLs

# Ensure the output directory exists
output_dir = os.path.dirname(output_file)
if output_dir and not os.path.exists(output_dir):
    os.makedirs(output_dir)

df = pd.read_csv(input_file)
df = df.head(500)
# Prepare output DataFrame to store results
results = []
blocked_urls = []  # List to keep track of blocked URLs

# Function to fetch content with Selenium and detailed logging to detect blocking
def fetch_content(url, request_count):
    display = Display(visible=0, size=(1024, 768))
    display.start()

    # Rotate user agent for each request
    ua = UserAgent()
    options = webdriver.FirefoxOptions()
    options.add_argument("--headless")
    options.set_preference("general.useragent.override", ua.random)  # Set a random user agent

    driver = webdriver.Firefox(options=options)

    try:
        driver.get(url)
        WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

        # Print the page source to debug content loading
        page_source = driver.page_source
        print(f"Page source for Request #{request_count}: {page_source[:500]}...")  # First 500 chars for debugging

        # Try to extract the content you want, for example, the body text
        page_content = driver.find_element(By.TAG_NAME, "body").text
        
        # If body is empty, try another element or print debug information
        if not page_content:
            print(f"Request #{request_count} - Empty content in body. Trying specific element.")
            page_content = driver.find_element(By.TAG_NAME, "html").text  # Fall back to full HTML text

        print(f"Request #{request_count} - Content snippet:", page_content[:500])  # Display first 500 chars
        return {"status": "Success", "content": page_content}

    except Exception as e:
        print(f"Request #{request_count} - Error fetching content: {e}")
        return {"status": "Error", "content": str(e)}

    finally:
        driver.quit()
        display.stop()

# Iterate over all URLs in the DataFrame
for idx, row in df.iterrows():
    url = row['entity-hover href'] 
    url = url.replace("my.", "")  # Remove "my." from the URL
    request_count = idx + 1
    result = fetch_content(url, request_count)

    # Handle possible blocking or captcha
    if result["status"] == "Error" or "captcha" in result["content"].lower() or "access denied" in result["content"].lower():
        print(f"Request #{request_count} - Block Detected. Moving to next URL.")
        result["status"] = "Blocked"
        blocked_urls.append({"URL": url, "Status": result["status"]})

    # Store result with URL, content, and status
    results.append({"URL": url, "Content": result["content"][:500], "Status": result["status"]})

    # Add random delay to mimic human browsing behavior
    time.sleep(random.uniform(5, 15))

# Save the results to the new CSV file with URL, Content, and Status columns
output_df = pd.DataFrame(results)
output_df.to_csv(output_file, index=False)
print(f"Results saved to {output_file}")

# Save the blocked URLs to a separate CSV file for blockage report
blocked_urls_df = pd.DataFrame(blocked_urls)
blocked_urls_df.to_csv(blockage_report_file, index=False)
print(f"Blockage report saved to {blockage_report_file}")
