from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core import auth
from app.services.payer_service import PayerService
from app.db.schema import get_db
from app.models.response import SuccessResponse
from app.models import payer as model
from app.core.exception import ForbiddenException

router = APIRouter(prefix="/payers", tags=["payers"])

def get_payer_service(db: Session = Depends(get_db)) -> PayerService:
    return PayerService(db)

@router.get("", status_code=status.HTTP_200_OK, response_model=SuccessResponse[list[model.PayerRead]])
def get_payers(service: PayerService = Depends(get_payer_service), role = Depends(auth.get_current_user)):
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(data=service.get_payers())

@router.get("/{id}", status_code=status.HTTP_200_OK, response_model=SuccessResponse[model.PayerRead])
def get_payer(id: int, service: PayerService = Depends(get_payer_service), role = Depends(auth.get_current_user)):
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(data=service.get_payer(id))

@router.post("", status_code=status.HTTP_201_CREATED, response_model=SuccessResponse[model.PayerRead])
def create_payer(request: model.PayerCrate, service: PayerService = Depends(get_payer_service), role = Depends(auth.get_current_user)):
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(data=service.create_payer(request), message="결제인이 성공적으로 추가되었습니다.")

@router.patch("/{id}", status_code=status.HTTP_200_OK, response_model=SuccessResponse[model.PayerRead])
def update_payer(
    id: int, 
    request: model.PayerUpdate, 
    service: PayerService = Depends(get_payer_service), 
    role = Depends(auth.get_current_user)
):
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(data=service.update_payer(id, request), message="결제인이 성공적으로 수정되었습니다.")

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payer(
    id: int, 
    service: PayerService = Depends(get_payer_service), 
    role = Depends(auth.get_current_user)
):
    if role != "admin":
        raise ForbiddenException()
    service.delete_payer(id)
    return