from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from db_models.session import get_db
from fastapi import HTTPException
from uuid import UUID
from sqlalchemy.orm import Session
from pydantic import BaseModel
from api.api_user import get_current_user, User as UserModelSerializer
from db_models.new_users import NewUsersDeals
from db_models.shared_user_deals import SharedUserDeals
from db_models.users import User
from db_models.deals import Deal

collaboration_router = APIRouter()

class CollaborationCreate(BaseModel):
    deal_id: UUID
    email : str


@collaboration_router.post("/collaborate/", response_model=None)
def add_collaboration(
    item: CollaborationCreate, 
    db: Session = Depends(get_db),
    current_user: UserModelSerializer = Depends(get_current_user)
):
    data = db.query(User).filter(User.email == item.email).first()
    
    if not data:
        new_user_data = db.query(NewUsersDeals).filter(
            NewUsersDeals.email_id == item.email, 
            NewUsersDeals.deal_id == item.deal_id
        ).first()
        
        if new_user_data:
            raise HTTPException(status_code=400, detail="User already added")

        new_user = NewUsersDeals(
            deal_id=item.deal_id,
            email_id=item.email
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"message": "User added successfully"}

    else:
        print(data.id, "test")
        existing_user = db.query(Deal).filter(
            Deal.user_id == data.id, 
            Deal.id == item.deal_id
        ).first()

        if existing_user:
            raise HTTPException(status_code=400, detail="User already added")
       
        shared_user_data = db.query(SharedUserDeals).filter(
            SharedUserDeals.user_id == data.id, 
            SharedUserDeals.deal_id == item.deal_id
        ).first()

        print(shared_user_data)

        if shared_user_data:
            raise HTTPException(status_code=400, detail="User already added")

        shared_user = SharedUserDeals(
            user_id=data.id,
            deal_id=item.deal_id
        )

        db.add(shared_user)
        db.commit()
        db.refresh(shared_user)
        return {"message": "User added successfully"}


