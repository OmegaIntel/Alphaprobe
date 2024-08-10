# search.py
import os
import requests
import requests
from bs4 import BeautifulSoup
from fastapi import HTTPException
from api.llm_models.llm import LLM

class BingSearch:
    def __init__(self):
        self.api_key = os.getenv("BING_API_KEY")
        if not self.api_key:
            raise ValueError("Bing API key is not set in environment variables.")
        self.endpoint = "https://api.bing.microsoft.com/v7.0/search"
        self.llm = LLM()

    def search(self, query: str):
        headers = {"Ocp-Apim-Subscription-Key": self.api_key}
        print(f"searching internet for {query}")
        params = {"q": query, "textDecorations": True, "textFormat": "HTML"}
        response = requests.get(self.endpoint, headers=headers, params=params)

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Error fetching data from Bing API")

        return response.json()
    
    def fetch_and_summarize(self, url):
        try:
            response = requests.get(url)
            if response.status_code == 200:
                page_content = response.text
                soup = BeautifulSoup(page_content, 'html.parser')
                paragraphs = soup.find_all('p')
                text = ' '.join([para.get_text() for para in paragraphs])
                
                summary = self.llm.summarize_content(text)
                return summary
            else:
                return "Content not accessible."
        except Exception as e:
            return f"Error fetching content: {str(e)}"


    def parse_search_results(self, search_results):
        # Extract relevant information from the search results
        parsed_results = []
        max_count = 5
        i = 0
        for result in search_results.get("webPages", {}).get("value", []):
            url = result.get("url")
            print(f"fetching {url}")
            summary = self.fetch_and_summarize(url)
            parsed_results.append({
                "name": result.get("name"),
                "url": url,
                "snippet": result.get("snippet") + " | Summary: " + summary,
                "dateLastCrawled": result.get("dateLastCrawled")
            })
            i += 1
            if i >= max_count:
                break
        return parsed_results

    def is_real_world_query(self, query: str) -> bool:
        # Simple keyword matching to determine if the query is about real-world data
        keywords = ["latest", "current", "real-time", "news", "update"]
        return any(keyword in query.lower() for keyword in keywords)
