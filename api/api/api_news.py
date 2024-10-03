from fastapi import APIRouter
import httpx
import xmltodict
from typing import List
from datetime import datetime
from dateutil import parser

new_router = APIRouter()

rss_urls = [
    "https://www.privateequitywire.co.uk/feed/",
    "https://www.altassets.net/feed",
    "https://pe-insights.com/feed/",
]
def reformat_pub_date(pub_date: str) -> str:
    try:
        parsed_date = parser.parse(pub_date)
        return parsed_date.strftime("%b %d, %Y, %I:%M %p")
    except Exception as e:
        print(f"Error formatting date: {e}")
        return pub_date  # Return the original date if it fails to format
async def combine_rss_feeds():
    combined_news = []

    async with httpx.AsyncClient() as client:

        for url in rss_urls:
            try:
                response = await client.get(url)
                if response.status_code == 200:
                    result = xmltodict.parse(response.text)
                    items = result.get("rss", {}).get("channel", {}).get("item", [])
                    for item in items:
                        news_item = {
                            "title": item.get("title"),
                            "link": item.get("link"),
                            "pubDate": reformat_pub_date(item.get("pubDate", ""))
                        }
                        combined_news.append(news_item)
                else:
                    print(f"Failed to fetch feed from {url} - Status code: {response.status_code}")
            except httpx.HTTPStatusError as e:
                print(f"HTTP error fetching feed from {url}: {e}")
            except httpx.RequestError as e:
                print(f"Error fetching feed from {url}: {e}")
                
    return combined_news

@new_router.get("/api/rss-feed", response_model=List[dict])
async  def get_rss_feed():
    combined_news = await combine_rss_feeds()
    return combined_news[:10]
