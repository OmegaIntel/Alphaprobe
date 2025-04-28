from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.utils.kb_search import query_kb 

aws_kb_router = APIRouter()

class QueryKBRequest(BaseModel):
  input_text: str
  kb_id: str
  user_id: str = ""
  project_id: str = ""
  model_arn: str

@aws_kb_router.post("/query_kb")
def query_kb_endpoint(request: QueryKBRequest):
  response = query_kb(
    input_text=request.input_text,
    kb_id=request.kb_id,
    user_id=request.user_id,
    project_id=request.project_id,
    model_arn=request.model_arn
  )
  if not response:
    raise HTTPException(status_code=500, detail="Error querying knowledge base")
  return response
