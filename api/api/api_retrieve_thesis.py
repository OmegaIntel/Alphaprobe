from fastapi import APIRouter, HTTPException
from db_models.user_thesis import retrieve_theses_with_query

retrieve_thesis_router = APIRouter()


@retrieve_thesis_router.get("/retrieve_thesis/")
async def retrieve_thesis(email_id: str):
    """
    API endpoint to retrieve theses with survey data based on email ID.
    Args:
        email_id (str): The email ID of the user.
    Returns:
        dict: Retrieved thesis and survey data.
    Raises:
        HTTPException: If no theses are found for the provided email ID or an error occurs.
    """

    try:
        filtered_theses = retrieve_theses_with_query(email_id=email_id)

        if not filtered_theses:
            raise HTTPException(status_code=404, detail="No theses found for the provided email ID.")

        return {"theses": filtered_theses}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving theses: {e}")