from fastapi import APIRouter, HTTPException, Form, Depends, Request
from pydantic import BaseModel, EmailStr
from db_models.session import get_db
from sqlalchemy.orm import Session
import json
from typing import Optional
from sqlalchemy.exc import SQLAlchemyError
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from db_models.workspace import CurrentWorkspace
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional
from db_models.deals import Deal, DealStatus
from db_models.shared_user_deals import SharedUserDeals
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
from api.api_user import get_current_user, User as UserModelSerializer
from db_models.checklist import Checklist
from datetime import datetime
from fastapi import Query


deals_router = APIRouter()

def load_json_file(filename: str) -> str:
    """Utility function to load and return the contents of a JSON file as a string."""
    with open(filename, 'r') as file:
        return file.read()


def format_investment_thesis(json_data: str) -> str:
    """Utility function to format investment thesis JSON data into a string."""
    data = json.loads(json_data)
    formatted_text = ""
    
    # Assuming the structure of the JSON you provided
    for section, items in data.items():
        formatted_text += f"**{section}**\n\n"
        for item in items["MacroeconomicTrends"]:
            formatted_text += f"{item}\n"
    
    return formatted_text


def format_valuation(json_data: str) -> str:
    """Utility function to format valuation JSON data into a readable string."""
    data = json.loads(json_data)
    formatted_text = ""
    
    # Loop through the main sections of the valuation
    for section, methodologies in data["valuation"].items():
        formatted_text += f"**{section.replace('_', ' ').title()}**\n\n"
        
        # Loop through each methodology and its questions
        for methodology, content in methodologies.items():
            formatted_text += f"  {methodology.replace('_', ' ').title()}:\n"
            for question in content.get("questions", []):
                formatted_text += f"    - {question}\n"
        formatted_text += "\n"
    
    return formatted_text

def format_market_research(json_data: str) -> str:
    """Utility function to format market research JSON data into a readable string."""
    data = json.loads(json_data)
    formatted_text = ""

    # Loop through the main sections of the market research
    for section, subcategories in data.items():
        section_title = section.replace('_', ' ').title()  # Format the section title
        formatted_text += f"**{section_title}**\n\n"

        # Loop through each subcategory within the section
        for subcategory, content in subcategories.items():
            subcategory_title = subcategory.replace('_', ' ').title()  # Format the subcategory title
            formatted_text += f"{subcategory_title}\n"

            # Loop through the list of questions for the subcategory, if available
            questions = content.get("questions", [])
            for question in questions:
                formatted_text += f"- {question}\n"
            formatted_text += "\n"

    return formatted_text


def format_financial_diligence(json_data: str) -> str:
    """Utility function to format financial diligence JSON data into a readable string."""
    data = json.loads(json_data)
    formatted_text = ""

    # Loop through the main sections of the financial diligence
    for section, content in data["Financial_Diligence"].items():
        formatted_text += f"**{section.replace('_', ' ').title()}**\n\n"

        # Loop through each subsection and its questions
        for subsection, details in content.items():
            formatted_text += f"  {subsection.replace('_', ' ').title()}:\n"
            
            for key, value in details.items():
                formatted_text += f"    - {key.replace('_', ' ').title()}: {value}\n"
        
        formatted_text += "\n"
    
    return formatted_text

class DealBase(BaseModel):
    name: str = Field(..., max_length=255)
    overview: Optional[str] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    industry: Optional[str] = Field(None, max_length=255)
    progress: Optional[str] = Field(None, max_length=255)
    status: Optional[str] = None

class DealResponse(DealBase):
    id: UUID

class DealCreation(DealBase):
    investment_thesis: Optional[str] = None


@deals_router.post("/api/deals/", response_model=DealResponse)
def create_deal(
    deal_data: DealCreation,
    db: Session = Depends(get_db),
    current_user: UserModelSerializer = Depends(get_current_user)
):
    try:
        # Create a new Deal object
        new_deal = Deal(
            user_id=current_user.id,
            name=deal_data.name,
            overview=deal_data.overview,
            start_date=deal_data.start_date or func.current_timestamp(),
            due_date=deal_data.due_date,
            industry=deal_data.industry,
            progress=deal_data.progress
        )
        db.add(new_deal)
        db.commit()
        db.refresh(new_deal)

        # Create and add the workspace entry
        new_ws = CurrentWorkspace(deal_id=new_deal.id, text=deal_data.investment_thesis, type="Investment Thesis")
        db.add(new_ws)
        db.commit()
        db.refresh(new_ws)

        investment_thesis_content = load_json_file('src/investment_thesis.json') 
        formatted_investment_thesis = format_investment_thesis(investment_thesis_content)
        valuation_content = load_json_file('src/valuation.json')
        formatted_valuation = format_valuation(valuation_content)
        market_research_content = load_json_file('src/market_research.json')
        formatted_market_research = format_market_research(market_research_content)
        financial_insights_content = load_json_file('src/financial_insights.json')
        formatted_insights_contnet = format_financial_diligence(financial_insights_content)


        print(investment_thesis_content, "!test!")

        # Create and add checklist entries for each JSON file content
        checklists = [
            Checklist(deal_id=new_deal.id, type="Investment Thesis", text=formatted_investment_thesis),
            Checklist(deal_id=new_deal.id, type="Valuation", text=formatted_valuation),
            Checklist(deal_id=new_deal.id, type="Market Research", text=formatted_market_research),
            Checklist(deal_id=new_deal.id, type="Financial Insights", text=formatted_insights_contnet)
        ]

        # Add all checklist items to the session at once
        db.add_all(checklists)
        db.commit() 
        
        # Return the new deal in the expected format
        return DealResponse(
            id=new_deal.id,
            name=new_deal.name,
            overview=new_deal.overview,
            start_date=new_deal.start_date,
            due_date=new_deal.due_date,
            industry=new_deal.industry,
            progress=new_deal.progress
        )
    except SQLAlchemyError as e:
        db.rollback()  # Rollback the session on error
        raise HTTPException(status_code=500, detail=str(e))
    

@deals_router.put("/api/deals/{deal_id}", response_model=DealResponse)
def update_deal(
    deal_id: str,
    deal_data: DealBase,
    db: Session = Depends(get_db),
    current_user: UserModelSerializer = Depends(get_current_user)
):
    try:
        # Fetch the deal by ID and ensure it belongs to the current user
        deal = db.query(Deal).filter(Deal.id == deal_id, Deal.user_id == current_user.id).first()
        
        if not deal:
            shared_deal = db.query(SharedUserDeals).filter(SharedUserDeals.deal_id == deal_id, SharedUserDeals.user_id == current_user.id).first()
            if shared_deal:
                deal = db.query(Deal).filter(Deal.id == shared_deal.deal_id).first()
            else:
                raise HTTPException(status_code=404, detail="Deal not found or you do not have access to it")

        # Update the deal fields that are provided
        if deal_data.name:
            deal.name = deal_data.name
        if deal_data.overview:
            deal.overview = deal_data.overview
        if deal_data.start_date:
            deal.start_date = deal_data.start_date
        if deal_data.due_date:
            deal.due_date = deal_data.due_date
        if deal_data.industry:
            deal.industry = deal_data.industry
        
        if deal_data.progress is not None:  # Ensure progress is not skipped
            progress = int(deal_data.progress)  # Convert progress from string to integer
            deal.progress = deal_data.progress
            
            # Update the status based on the progress value
            if progress == 0:
                deal.status = DealStatus.NOT_STARTED
            elif progress == 100:
                deal.status = DealStatus.COMPLETED
            else:
                deal.status = DealStatus.IN_PROGRESS
        
        deal.updated_at = func.current_timestamp()
        # Commit the changes to the database
        db.commit()
        db.refresh(deal)


        # Return the updated deal
        return DealResponse(
            id=deal.id,
            name=deal.name,
            overview=deal.overview,
            start_date=deal.start_date,
            due_date=deal.due_date,
            industry=deal.industry,
            progress=deal.progress,
            status=deal.status.value  # Return the string value of the Enum
        )
    except SQLAlchemyError as e:
        db.rollback()  # Rollback the session in case of an error
        raise HTTPException(status_code=500, detail=str(e))



@deals_router.delete("/api/delete_deal")
def delete_deal(
    deal_id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: UserModelSerializer = Depends(get_current_user)
):
    """
    Delete a deal by its ID if the user is the owner or has shared access.
    deal_id is provided as a query parameter.
    """
    # 1. Attempt to find the deal directly by user ownership
    deal = db.query(Deal).filter(
        Deal.id == deal_id,
        Deal.user_id == current_user.id
    ).first()

    # 2. If not found, check if it is a shared deal
    if not deal:
        shared_deal = db.query(SharedUserDeals).filter(
            SharedUserDeals.deal_id == deal_id,
            SharedUserDeals.user_id == current_user.id
        ).first()
        if shared_deal:
            deal = db.query(Deal).filter(Deal.id == shared_deal.deal_id).first()
        else:
            raise HTTPException(
                status_code=404,
                detail="Deal not found or you do not have access to it"
            )

    # 3. If we have a deal, delete any related records if necessary 
    #    (only if you don't have cascade deletes set up on the DB).
    
    # Example of deleting related records (if no DB cascading is configured):
    
    # Delete from checklists
    db.query(Checklist).filter(Checklist.deal_id == deal.id).delete()

    # Delete from workspace
    db.query(CurrentWorkspace).filter(CurrentWorkspace.deal_id == deal.id).delete()

    # Delete from shared deals
    db.query(SharedUserDeals).filter(SharedUserDeals.deal_id == deal.id).delete()
    
    # 4. Finally, delete the deal itself
    db.delete(deal)
    db.commit()

    return {"detail": f"Deal with id {deal_id} has been deleted."}

@deals_router.get("/api/fetch_deals", response_model=List[DealResponse])
def get_deals(
    db: Session = Depends(get_db),
    current_user: UserModelSerializer = Depends(get_current_user)
):
    all_deals = []
    sorted_deals = []
    deals = db.query(Deal).filter(Deal.user_id == current_user.id).all()
    for deal in deals:
        all_deals.append(deal)
    shared_deals = db.query(SharedUserDeals).filter(SharedUserDeals.user_id == current_user.id).all()
    for shared_deal in shared_deals:
        deals = db.query(Deal).filter(Deal.id == shared_deal.deal_id).all()
        for deal in deals:
            all_deals.append(deal)

    for deal in all_deals:
        if isinstance(deal.updated_at, str):
            deal.updated_at = datetime.strptime(deal.updated_at, "%Y-%m-%d %H:%M:%S")

    # Sort the deals by updated_at in descending order (newest first)
    if len(all_deals) != 0:
        sorted_deals = sorted(all_deals, key=lambda deal: deal.updated_at, reverse=True)
    
    return sorted_deals
