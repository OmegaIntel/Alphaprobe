import os
import time
from typing import List, Dict, Any

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY")
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")

def call_tavily_api(query: str) -> List[Dict[str, str]]:
    import requests
    print(f"[DEBUG] call_tavily_api: {query}")
    api_url = "https://api.tavily.com/search"
    headers = {"Authorization": f"Bearer {TAVILY_API_KEY}", "Content-Type": "application/json"}
    payload = {"query": query, "max_results": 5, "include_raw_content": True}
    results = []
    for attempt in range(3):
        print(f"[DEBUG] Tavily API attempt {attempt+1}")
        try:
            response = requests.post(api_url, json=payload, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                for item in data.get("results", []):
                    results.append({
                        "title": item.get("title", ""),
                        "url": item.get("url", ""),
                        "snippet": item.get("content", "")
                    })
                break
        except Exception as e:
            print(f"[DEBUG] Tavily API attempt {attempt+1} failed with error: {e}")
            if attempt < 2:
                time.sleep(2)
    print(f"[DEBUG] Tavily API returned {len(results)} results")
    return results

def call_serpapi(query: str) -> List[Dict[str, str]]:
    import requests
    print(f"[DEBUG] call_serpapi: {query}")
    api_url = "https://serpapi.com/search"
    params = {
        "q": query,
        "api_key": SERPAPI_API_KEY,
        "engine": "google",
        "num": 5,
        "hl": "en"
    }
    results = []
    for attempt in range(3):
        print(f"[DEBUG] SerpAPI attempt {attempt+1}")
        try:
            response = requests.get(api_url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                organic_results = data.get("organic_results", [])
                for item in organic_results:
                    results.append({
                        "title": item.get("title", ""),
                        "url": item.get("link", ""),
                        "snippet": item.get("snippet", "")
                    })
                break
        except Exception as e:
            print(f"[DEBUG] SerpAPI attempt {attempt+1} failed with error: {e}")
            if attempt < 2:
                time.sleep(2)
    print(f"[DEBUG] SerpAPI returned {len(results)} results")
    return results

def call_perplexity_api(query: str, api_key: str, max_results: int = 5, depth: int = 3) -> Dict[str, Any]:

    """Enhanced Perplexity API call with structured output and error handling"""
    import requests
    from datetime import datetime
    
    print(f"[DEBUG] Starting Perplexity API call for: {query[:100]}...")
    start_time = time.time()
    
    api_url = "https://api.perplexity.ai/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    # Enhanced system prompt from research router
    system_prompt = f"""
    Conduct comprehensive research with depth level {depth}:
    - Level 1: Key facts and overview
    - Level 2: Detailed insights with references
    - Level 3: Full analysis with trends and benchmarks
    Include structured data, statistics, and sources where available.
    Current date: {datetime.now().strftime('%Y-%m-%d')}
    """
    
    payload = {
        "model": "sonar-pro",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query}
        ],
        "max_tokens": 4000,
        "temperature": 0.1
    }
    
    try:
        response = requests.post(
            api_url,
            headers=headers,
            json=payload,
            timeout=30  # Increased timeout for deep research
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"[DEBUG] Perplexity API success in {(time.time()-start_time):.2f}s")
            
            # Extract and format response similar to research router
            content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
            return {
                "success": True,
                "content": content,
                "raw_response": result,
                "processing_time": time.time() - start_time
            }
            
        else:
            error_msg = f"API Error {response.status_code}: {response.text}"
            print(f"[ERROR] Perplexity API failed: {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "status_code": response.status_code
            }
            
    except Exception as e:
        error_msg = f"Request failed: {str(e)}"
        print(f"[ERROR] Perplexity API exception: {error_msg}")
        return {
            "success": False,
            "error": error_msg,
            "status_code": 500
        }
