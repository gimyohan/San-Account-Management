from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.schema import Budget, FiscalTerm, Category
from app.models.budget import BudgetResponse, BudgetCreate

class BudgetService:
    def __init__(self, db: Session):
        self.db = db

    def get_budgets(self, fiscal_term_id: int) -> list[BudgetResponse]:
        stmt = select(Budget).where(Budget.fiscal_term_id == fiscal_term_id)
        result = self.db.scalars(stmt).all()
        return result
    
    def create_budget(self, request: BudgetCreate) -> BudgetResponse:
        if self.db.scalars(select(Category).where(Category.id == request.category_id)).first() is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="존재하지 않는 카테고리입니다.")
        if self.db.scalars(select(FiscalTerm).where(FiscalTerm.id == request.fiscal_term_id)).first() is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="존재하지 않는 회계연도입니다.")
        if self.db.scalars(select(Budget).where(Budget.category_id == request.category_id, Budget.fiscal_term_id == request.fiscal_term_id)).first() is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 존재하는 예산입니다.")
        budget = Budget(**request.dict())
        self.db.add(budget)
        self.db.commit()
        self.db.refresh(budget)
        return budget

    def update_budget(self, id: int, request: BudgetCreate) -> BudgetResponse:
        budget = self.db.scalars(select(Budget).where(Budget.id == id)).first()
        if budget is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="존재하지 않는 예산입니다.")
        budget.category_id = request.category_id
        budget.fiscal_term_id = request.fiscal_term_id
        budget.amount = request.amount
        self.db.commit()
        self.db.refresh(budget)
        return budget

    def delete_budget(self, id: int) -> None:
        budget = self.db.scalars(select(Budget).where(Budget.id == id)).first()
        if budget is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="존재하지 않는 예산입니다.")
        self.db.delete(budget)
        self.db.commit()
        return None