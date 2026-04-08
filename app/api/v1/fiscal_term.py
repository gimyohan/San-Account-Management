from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from starlette import status

from app.db.schema import get_db
from app.core.auth import get_current_user
from app.models.response import SuccessResponse
from app.services.fiscal_term_service import FiscalTermService
from app.models.fiscal_term import FiscalTermResponse, FiscalTermCrate

router = APIRouter(prefix="/fiscal-term", tags=["fiscal-term"])

def get_fiscal_term_service(session: Session = Depends(get_db)) -> FiscalTermService:
    return FiscalTermService(session)

@router.get("/", status_code=status.HTTP_200_OK, response_model=SuccessResponse[list[FiscalTermResponse]])
def get_fiscal_terms(
    service: FiscalTermService = Depends(get_fiscal_term_service),
    role: str = Depends(get_current_user)
):
    if role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="관리자 권한이 필요합니다.")
    return SuccessResponse(data=service.get_fiscal_terms())

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=SuccessResponse[FiscalTermResponse])
def create_fiscal_term(
    request: FiscalTermCrate,
    service: FiscalTermService = Depends(get_fiscal_term_service),
    role: str = Depends(get_current_user)
):
    if role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="관리자 권한이 필요합니다.")
    return SuccessResponse(data=service.create_fiscal_term(request))

@router.put("/{id}", status_code=status.HTTP_200_OK, response_model=SuccessResponse[FiscalTermResponse])
def update_fiscal_term(
    id: int,
    request: FiscalTermCrate,
    service: FiscalTermService = Depends(get_fiscal_term_service),
    role: str = Depends(get_current_user)
):
    if role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="관리자 권한이 필요합니다.")
    return SuccessResponse(data=service.update_fiscal_term(id, request))

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fiscal_term(
    id: int,
    service: FiscalTermService = Depends(get_fiscal_term_service),
    role: str = Depends(get_current_user)
):
    if role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="관리자 권한이 필요합니다.")
    service.delete_fiscal_term(id)
