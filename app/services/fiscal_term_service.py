from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from starlette import status

from app.db.schema import FiscalTerm, Budget
from app.models.fiscal_term import FiscalTermResponse, FiscalTermCrate

class FiscalTermService:
    def __init__(self, session: Session):
        self.db = session

    def get_fiscal_terms(self):
        fiscal_terms = self.db.scalars(select(FiscalTerm)).all()
        return [FiscalTermResponse(**fiscal_term.__dict__) for fiscal_term in fiscal_terms]

    def create_fiscal_term(self, request: FiscalTermCrate):
        fiscal_term = FiscalTerm(**request.model_dump())
        self.db.add(fiscal_term)
        self.db.commit()
        self.db.refresh(fiscal_term)
        return fiscal_term
        
    def update_fiscal_term(self, id: int, request: FiscalTermCrate):
        fiscal_term = self.db.scalars(select(FiscalTerm).where(FiscalTerm.id == id)).first()
        if not fiscal_term:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="회계연도가 존재하지 않습니다.")
        fiscal_term.name = request.name
        fiscal_term.start_date = request.start_date
        fiscal_term.end_date = request.end_date
        self.db.commit()
        self.db.refresh(fiscal_term)
        return fiscal_term

    def delete_fiscal_term(self, id: int):
        fiscal_term = self.db.scalars(select(FiscalTerm).where(FiscalTerm.id == id)).first()
        if not fiscal_term:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="회계연도가 존재하지 않습니다.")
        budgets = self.db.scalars(select(Budget).where(Budget.fiscal_term_id == id)).all()
        for budget in budgets:
            self.db.delete(budget)
        self.db.delete(fiscal_term)
        self.db.commit()
        return