from fastapi import APIRouter, Depends, status

from app.db.schema import Session, get_db
from app.core.auth import get_current_user
from app.services.year_service import YearService
from app.models.response import SuccessResponse
from app.models import year as model
from app.core.exception import ForbiddenException

def get_year_service(session: Session = Depends(get_db)):
    return YearService(session)

router = APIRouter(prefix="/years", tags=["years"])

@router.get("", status_code=status.HTTP_200_OK, response_model=SuccessResponse[list[model.YearRead]])
def get_years(service: YearService = Depends(get_year_service), role: str = Depends(get_current_user)):
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(data=service.get_years())

@router.post("", status_code=status.HTTP_201_CREATED, response_model=SuccessResponse[model.YearRead])
def create_year(request: model.YearCreate, service: YearService = Depends(get_year_service), role: str = Depends(get_current_user)):
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(data=service.create_year(request))

@router.put("/{year_id}", status_code=status.HTTP_200_OK, response_model=SuccessResponse[model.YearRead])
def update_year(year_id: int, request: model.YearCreate, service: YearService = Depends(get_year_service), role: str = Depends(get_current_user)):
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(data=service.update_year(year_id, request))

@router.delete("/{year_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_year(year_id: int, service: YearService = Depends(get_year_service), role: str = Depends(get_current_user)):
    if role != "admin":
        raise ForbiddenException()
    service.delete_year(year_id)