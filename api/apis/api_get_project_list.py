from typing import Optional
from fastapi.responses import JSONResponse
from api.apis.api_get_current_user import get_current_user
from fastapi import APIRouter, Depends, HTTPException, Query
from db_models.projects import Project
from db.db_session import get_db
from sqlalchemy.orm import Session
from sqlalchemy import desc
from dotenv import load_dotenv, find_dotenv

env_path = find_dotenv()  # walks up until it finds .env
loaded = load_dotenv(env_path)



project_list_router = APIRouter()


@project_list_router.get("/api/project-list")
def get_all_projects_sorted_by_updated_at(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(10),
    offset: int = Query(0),
    workflow: Optional[str] = Query(None),  # 👈 NEW
):
    try:
        user_id = current_user.id
        query = db.query(Project).filter(Project.user_id == user_id)
        if workflow:
            query = query.filter(Project.workflow == workflow)

        total_count = query.count()
        projects = (
            query.order_by(desc(Project.updated_at)).offset(offset).limit(limit).all()
        )

        fetched_projects = [
            {
                "id": str(project.id),
                "name": str(project.name),
                "updated_at": str(project.updated_at),
                "temp_project_id": str(project.temp_project_id),
                "user_id": str(project.user_id),
                "workflow": str(project.workflow),
            }
            for project in projects
        ]

        return JSONResponse(
            content={
                "message": "Projects fetched successfully",
                "data": fetched_projects,
                "pagination": {
                    "total": total_count,
                    "offset": offset,
                    "limit": limit,
                    "has_more": offset + limit < total_count,
                },
            },
            status_code=200,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

