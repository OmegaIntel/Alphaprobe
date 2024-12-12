import os
import json
import pandas as pd
import scipy.spatial
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from openai import OpenAI
from api.data.data_access import IBIS_NAICS_CODES, IBIS_REPORT_NAMES, IBIS_MAP

from dotenv import load_dotenv
load_dotenv()

# Initialize OpenAI Client
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY is not set in the environment variables.")
OPENAI_CLIENT = OpenAI(api_key=OPENAI_API_KEY)


# Load Embeddings
try:
    IBIS_EMBEDDINGS = pd.read_csv('api/data/ibis_embeddings.csv')
    IBIS_EMBEDDINGS["query_embedding"] = IBIS_EMBEDDINGS["query_embedding"].apply(lambda x: json.loads(x))
except Exception as e:
    raise ValueError(f"Failed to load embeddings: {e}")



# Pydantic Models
class UserSearchQuery(BaseModel):
    search_query: str

class IndustryName(BaseModel):
    industry_name: str

class DataModelOut(BaseModel):
    result: List[IndustryName]

# Define Router
search_industries_router = APIRouter()

def get_embedding(text: str, model: str = 'text-embedding-3-small') -> np.ndarray:
    """Fetch embedding for input text."""
    try:
        response = OPENAI_CLIENT.embeddings.create(input=[text], model=model)
        return np.array(response.data[0].embedding)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate embedding: {e}")

def semantic_search(query: str, embeddings_df: pd.DataFrame, top_k: int = 6) -> List[Dict[str, str]]:
    """Perform a semantic search to find similar industries."""
    embedding = get_embedding(query)

    # Safely compute cosine similarity
    embeddings_df['similarity'] = embeddings_df['query_embedding'].apply(
        lambda x: 1 - scipy.spatial.distance.cosine(x, embedding) if isinstance(x, list) else 0.0
    )

    results = embeddings_df.sort_values('similarity', ascending=False).head(top_k)
    return results.apply(lambda x: {
        'industry_name': x.get('reportName', 'Unknown')
    }, axis=1).to_list()




@search_industries_router.post("/api/industries-for-userquery", response_model=DataModelOut)
async def industries_for_query(request: UserSearchQuery):
    """Takes a single search query and performs a semantic search for industries."""
    search_query = request.search_query.strip()
    results = semantic_search(search_query, IBIS_EMBEDDINGS)

    return DataModelOut(result=results)
