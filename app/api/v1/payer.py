from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core import auth
from app.services.payer_service import PayerService
from app.db.schema import get_db
from app.models.response import SuccessResponse
from app.models.payer import PayerRead, PayerCrate
from app.exception.auth import ForbiddenException

router = APIRouter(prefix="/payers", tags=["payers"])

def get_payer_service(db: Session = Depends(get_db)) -> PayerService:
    return PayerService(db)

@router.get("/", status_code=status.HTTP_200_OK)
def get_payers(service: PayerService = Depends(get_payer_service), role = Depends(auth.get_current_user)) -> SuccessResponse[list[PayerRead]]:
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(data=service.get_payers())

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_payer(payer: PayerCrate, service: PayerService = Depends(get_payer_service), role = Depends(auth.get_current_user)) -> SuccessResponse[PayerRead]:
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(data=service.create_payer(payer.name, payer.account), message="결제인이 성공적으로 추가되었습니다.")

@router.patch("/{id}", status_code=status.HTTP_200_OK)
def update_payer(id: int, payer: PayerCrate, service: PayerService = Depends(get_payer_service), role = Depends(auth.get_current_user)) -> SuccessResponse[PayerRead]:
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(data=service.update_payer(id, payer.name, payer.account), message="결제인이 성공적으로 수정되었습니다.")

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payer(id: int, service: PayerService = Depends(get_payer_service), role = Depends(auth.get_current_user)) -> None:
    if role != "admin":
        raise ForbiddenException()
    service.delete_payer(id)
    return