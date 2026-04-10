from fastapi import APIRouter, Depends, status

from app.db.schema import get_db
from app.core.auth import get_current_user
from app.core.exception import ForbiddenException
from app.services.quarter_service import QuarterService
from app.models.response import SuccessResponse
from app.models import quarter as model

def get_quarter_service(db = Depends(get_db)):
    return QuarterService(db)

router = APIRouter(prefix="/quarters", tags=["quarters"])

@router.get("", status_code=status.HTTP_200_OK, response_model=SuccessResponse[list[model.QuarterRead]])
def get_quarters(year_id: int, quarter_service: QuarterService = Depends(get_quarter_service), role: str = Depends(get_current_user)):
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(data=quarter_service.get_quarters(year_id))

@router.post("", status_code=status.HTTP_201_CREATED, response_model=SuccessResponse[model.QuarterRead])
def create_quarter(request: model.QuarterCreate, quarter_service: QuarterService = Depends(get_quarter_service), role: str = Depends(get_current_user)):
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(data=quarter_service.create_quarter(request))

@router.patch("/{quarter_id}", status_code=status.HTTP_200_OK, response_model=SuccessResponse[model.QuarterRead])
def update_quarter(quarter_id: int, request: model.QuarterUpdate, quarter_service: QuarterService = Depends(get_quarter_service), role: str = Depends(get_current_user)):
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(data=quarter_service.update_quarter(quarter_id, request))

@router.delete("/{quarter_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quarter(quarter_id: int, quarter_service: QuarterService = Depends(get_quarter_service), role: str = Depends(get_current_user)):
    if role != "admin":
        raise ForbiddenException()
    return quarter_service.delete_quarter(quarter_id)