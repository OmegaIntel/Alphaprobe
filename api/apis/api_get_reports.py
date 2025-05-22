from fastapi.responses import JSONResponse
from api.apis.api_get_current_user import get_current_user
from fastapi import APIRouter, Depends, HTTPException
from db_models.reports import ReportTable
from db.db_session import get_db
from sqlalchemy.orm import Session
from sqlalchemy import asc
from dotenv import load_dotenv, find_dotenv

env_path = find_dotenv()  # walks up until it finds .env
loaded = load_dotenv(env_path)


reports_router = APIRouter()


@reports_router.get("/api/project/{project_id}/reports")
def get_reports_sorted_by_updated_at(
    project_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        # 1️⃣ **Fetch reports for a given project, sorted by `updated_at` (oldest first)**
        reports = (
            db.query(ReportTable)
            .filter(ReportTable.project_id == project_id)
            .order_by(asc(ReportTable.updated_at))
            .all()
        )

        if not reports:
            raise HTTPException(
                status_code=404, detail="No reports found for this project"
            )

        fetched_reports = [
            {
                "id": str(report.id),
                "query": str(report.query),
                "response": str(report.response),
                "updated_at": str(report.updated_at),
                "citations": report.citations,
                "research": str(report.research),
            }
            for report in reports
        ]

        return JSONResponse(
            content={
                "message": "Reports fetched successfully",
                "data": fetched_reports,
            },
            status_code=200,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
