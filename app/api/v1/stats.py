from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException
from starlette import status

from app.db.schema import get_db
from app.core.auth import get_current_user
from app.services.status_service import StatusService
from app.models.status import BalanceResponse

from datetime import datetime

router = APIRouter(prefix="/stats", tags=["stats"])

def get_status_service(db: Session = Depends(get_db)):
    return StatusService(db)

@router.get("/balance", status_code=status.HTTP_200_OK, response_model=BalanceResponse)
def get_balance(
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    service: StatusService = Depends(get_status_service), 
    role: str = Depends(get_current_user)
):
    if role != "admin":
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")
    return service.get_balance(start_date, end_date)