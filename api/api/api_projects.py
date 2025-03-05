from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db_models.session import get_db
from pydantic import BaseModel
from datetime import datetime
from db_models.Projects import Project
from fastapi.responses import JSONResponse

project_router = APIRouter()
class ProjectCreate(BaseModel):
    name: str

class ProjectResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime

class Config:
        from_attributes = True

@project_router.post("/api/projects/", response_model=ProjectResponse)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    new_project = Project(name=project.name)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return JSONResponse(
            content={
                "message": "project created successfully",
                "data": new_project
            },
            status_code=200
        )


