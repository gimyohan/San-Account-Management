from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.schema import get_db
from app.core.auth import get_current_user
from app.services.budget_service import BudgetService
from app.models.response import SuccessResponse
from app.models.budget import BudgetResponse, BudgetCreate


router = APIRouter(prefix="/budgets", tags=["budgets"])

def get_budget_service(db: Session = Depends(get_db)):
    return BudgetService(db)


@router.get("/", status_code=status.HTTP_200_OK, response_model=SuccessResponse[list[BudgetResponse]])
def get_budgets(
    fiscal_term_id: int,
    role: str = Depends(get_current_user),
    service: BudgetService = Depends(get_budget_service),
):
    if role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="관리자 권한이 필요합니다.")
    return SuccessResponse(data=service.get_budgets(fiscal_term_id))

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=SuccessResponse[BudgetResponse])
def create_budget(
    request: BudgetCreate,
    role: str = Depends(get_current_user),
    service: BudgetService = Depends(get_budget_service),
):
    if role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="관리자 권한이 필요합니다.")
    return SuccessResponse(data=service.create_budget(request))

@router.put("/{id}", status_code=status.HTTP_200_OK, response_model=SuccessResponse[BudgetResponse])
def update_budget(
    id: int,
    request: BudgetCreate,
    role: str = Depends(get_current_user),
    service: BudgetService = Depends(get_budget_service),
):
    if role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="관리자 권한이 필요합니다.")
    return SuccessResponse(data=service.update_budget(id, request))

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    id: int,
    role: str = Depends(get_current_user),
    service: BudgetService = Depends(get_budget_service),
):
    if role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="관리자 권한이 필요합니다.")
    service.delete_budget(id)
    return