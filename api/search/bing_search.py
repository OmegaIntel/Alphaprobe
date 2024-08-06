# search.py
import os
import requests
from fastapi import HTTPException

class BingSearch:
    def __init__(self):
        self.api_key = os.getenv("BING_API_KEY")
        if not self.api_key:
            raise ValueError("Bing API key is not set in environment variables.")
        self.endpoint = "https://api.bing.microsoft.com/v7.0/search"

    def search(self, query: str):
        headers = {"Ocp-Apim-Subscription-Key": self.api_key}
        print(f"searching internet for {query}")
        params = {"q": query, "textDecorations": True, "textFormat": "HTML"}
        response = requests.get(self.endpoint, headers=headers, params=params)

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Error fetching data from Bing API")

        return response.json()

    def parse_search_results(self, search_results):
        # Extract relevant information from the search results
        parsed_results = []
        for result in search_results.get("webPages", {}).get("value", []):
            parsed_results.append({
                "name": result.get("name"),
                "url": result.get("url"),
                "snippet": result.get("snippet"),
                "dateLastCrawled": result.get("dateLastCrawled")
            })
        return parsed_results

    def is_real_world_query(self, query: str) -> bool:
        # Simple keyword matching to determine if the query is about real-world data
        keywords = ["latest", "current", "real-time", "news", "update"]
        return any(keyword in query.lower() for keyword in keywords)
