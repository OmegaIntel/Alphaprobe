import pytest
import asyncio
import json
import subprocess
from pathlib import Path

@pytest.mark.asyncio
async def test_scrapy_crawl():
    company_urls = [
        "https://www.linkedin.com/company/tesla-motors"
    ]
    
    # Path to store the output file
    output_file = "company_profile_data.json"
    
    # Run the Scrapy crawl command with the specified URL as an argument
    result = await asyncio.create_subprocess_exec(
        "scrapy", 
        "crawl", 
        "company_profile_scraper", 
        "-a", f"urls={json.dumps(company_urls)}", 
        "-O", output_file,
        stdout=asyncio.subprocess.PIPE, 
        stderr=asyncio.subprocess.PIPE
    )
    
    # Wait for the subprocess to finish
    stdout, stderr = await result.communicate()

    # Ensure there is no error during crawling
    assert result.returncode == 0, f"Scrapy crawl failed: {stderr.decode()}"
    
    # Check if output file exists and has content
    assert Path(output_file).exists(), f"Output file {output_file} not found"
    
    # Load the output JSON
    with open(output_file, 'r') as f:
        data = json.load(f)
    
    # Check if the output is a list and has at least one item
    assert isinstance(data, list), "Output is not a list"
    assert len(data) > 0, "Output list is empty"
    
    # Extract the first item from the list (assuming there's only one company profile)
    company_data = data[0]
    
    # Check if data has the expected keys
    expected_keys = [
        "company_name", "linkedin_followers_count", "company_logo_url",
        "about_us", "num_of_employees", "website", "industry",
        "company_size_approx", "headquarters", "type", "founded",
        "specialties", "funding", "funding_total_rounds", 
        "funding_option", "last_funding_round"
    ]
    
    for key in expected_keys:
        assert key in company_data, f"Missing key {key} in the output"
    
    # Optionally, validate some data
    assert company_data["company_name"] == "Tesla", "Company name mismatch"
    assert company_data["website"] == "https://www.tesla.com/careers", "Website URL mismatch"
    assert company_data["headquarters"] == "Austin, Texas", "headquarters mismatch"
    assert company_data["industry"] == "Motor Vehicle Manufacturing", "industry mismatch"