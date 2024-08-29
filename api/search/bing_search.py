# search.py
import os
import requests
import requests
from bs4 import BeautifulSoup
from fastapi import HTTPException
from api.llm_models.llm import LLM
from api.interfaces import Retriever


class BingSearch(Retriever):
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
            response = requests.get(url, timeout=10)  # Set a 10-second timeout for the request
            if response.status_code == 200:
                page_content = response.text
                soup = BeautifulSoup(page_content, 'html.parser')
                paragraphs = soup.find_all('p')
                text = ' '.join([para.get_text() for para in paragraphs])
                print("content loaded")

                # Use the LLM for summarization
                summary = self.llm.summarize_content(text)  # Assuming `self.llm.summarize` is the method for summarization
                print("summary generated")
                return summary
            else:
                return "Content not accessible."
        except requests.Timeout:
            return "Request timed out."
        except Exception as e:
            return f"Error fetching content: {str(e)}"

    def parse_search_results(self, search_results):
        # Extract relevant information from the search results
        parsed_results = []
        MAX_PAGES_TO_SUMMARIZE = 5
        for result in search_results.get("webPages", {}).get("value", [])[:MAX_PAGES_TO_SUMMARIZE]:
            url = result.get("url")
            print(f"fetching {url}")
            summary = self.fetch_and_summarize(url)
            parsed_results.append({
                "name": result.get("name"),
                "url": url,
                "snippet": result.get("snippet") + " | Summary: " + summary,
                "dateLastCrawled": result.get("dateLastCrawled")
            })
        return parsed_results

    def context(self, user_query: str, company_name: str, user_email: str) -> str:
        """Implements the interface."""
        assert company_name
        assert user_email
        search_results = self.search(user_query)
        parsed_results = self.parse_search_results(search_results)
        print(parsed_results)
        if not parsed_results:
            raise HTTPException(status_code=400, detail="No relevant data found for the query.")
        context = "\n Following is search result from internet for real-time \n"
        for result in parsed_results:
            context += f" {result['name']}: {result['snippet']} (Source: {result['url']})"
        return context
