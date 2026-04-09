from fastapi import APIRouter, Depends
from starlette import status

from app.db.schema import get_db
from app.core.auth import get_current_user
from app.services.receipt_service import ReceiptService
from app.models.response import SuccessResponse
from app.models.receipt import ReceiptRead, ReceiptCreate
from app.core.exception import ForbiddenException

from datetime import datetime

router = APIRouter(prefix="/receipts", tags=["receipts"])

def get_receipt_service(db=Depends(get_db)) -> ReceiptService:
    return ReceiptService(db)

@router.get("", status_code=status.HTTP_200_OK, response_model=SuccessResponse[list[ReceiptRead]])
def get_receipts(
    year_id: int | None = None,
    quarter_id: int | None = None,
    start_date: datetime | None = None, 
    end_date: datetime | None = None,
    category_id: int | None = None, 
    payer_id: int | None = None, 
    is_transferred: bool | None = None,
    service: ReceiptService = Depends(get_receipt_service), user=Depends(get_current_user)
) -> SuccessResponse[list[ReceiptRead]]:

    if user != "admin":
        raise ForbiddenException("관리자만 접근할 수 있습니다.")
    return SuccessResponse(data=service.get_receipts(year_id, quarter_id, start_date, end_date, category_id, payer_id, is_transferred))

@router.get("/{id}", status_code=status.HTTP_200_OK, response_model=SuccessResponse[ReceiptRead])
def get_receipt(id: int, service: ReceiptService = Depends(get_receipt_service), user=Depends(get_current_user)) -> SuccessResponse[ReceiptRead]:
    if user != "admin":
        raise ForbiddenException("관리자만 접근할 수 있습니다.")
    return SuccessResponse(data=service.get_receipt(id))

@router.post("", status_code=status.HTTP_201_CREATED, response_model=SuccessResponse[ReceiptRead])
def create_receipt(receipt: ReceiptCreate, service: ReceiptService = Depends(get_receipt_service), user=Depends(get_current_user)) -> SuccessResponse[ReceiptRead]:
    if user != "admin":
        raise ForbiddenException("관리자만 접근할 수 있습니다.")
    return SuccessResponse(data=service.create_receipt(receipt))

@router.patch("/{id}", status_code=status.HTTP_200_OK, response_model=SuccessResponse[ReceiptRead])
def update_receipt(id: int, receipt: ReceiptCreate, service: ReceiptService = Depends(get_receipt_service), user=Depends(get_current_user)) -> SuccessResponse[ReceiptRead]:
    if user != "admin":
        raise ForbiddenException("관리자만 접근할 수 있습니다.")
    return SuccessResponse(data=service.update_receipt(id, receipt))

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_receipt(id: int, service: ReceiptService = Depends(get_receipt_service), user=Depends(get_current_user)):
    if user != "admin":
        raise ForbiddenException("관리자만 접근할 수 있습니다.")
    service.delete_receipt(id)
    return