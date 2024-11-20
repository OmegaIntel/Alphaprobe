from fastapi import APIRouter, HTTPException, Query
from typing import List
from rapidfuzz import process, fuzz
import csv
from pathlib import Path

# Initialize the router
search_router = APIRouter()

# Get the directory of the current script
script_dir = Path(__file__).parent
file_path = script_dir / "data/IBIS NAICS Code mapping.csv"

# Initialize an empty list to store the names
data_list = []

# Open and read the CSV file
with open(file_path, mode='r') as file:
    csv_reader = csv.reader(file)
    
    # Loop through each row in the CSV
    for row in csv_reader:
        # Append the first column (name) to the names list
        data_list.append({"name": row[0], "code": row[1]})

# Fuzzy search function
def fuzzy_search(query: str, data: List[dict[str, str]], limit: int = 10) -> List[dict[str, str]]:
    dataset_normalized = [item["name"].lower().strip() for item in data_list]
    query_normalized = query.lower().strip()

    results = process.extract(query_normalized, dataset_normalized, limit=10, scorer=fuzz.partial_ratio)

    matches = []
    for match in results:
        matched_name = match[0]  # The normalized name
        score = match[1]         # The matching score
        # Find the original entry in the data
        original_entry = next(item for item in data if item["name"].lower().strip() == matched_name)
        matches.append({"name": original_entry["name"], "code": original_entry["code"]})

    return matches

# Define the fuzzy search API endpoint
@search_router.get("/api/fuzzy-search", response_model=List[dict[str, str]])
async def get_fuzzy_search(query: str = Query(..., description="Search query term")):
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter is required.")
    
    # Perform fuzzy search on the list of industry names
    results = fuzzy_search(query, data_list)
    return results[:10]
