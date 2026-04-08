from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.db.schema import Receipt
from app.models.status import BalanceResponse

from datetime import datetime

class StatusService:
    def __init__(self, session: Session):
        self.db = session

    def get_balance(self, start_date: datetime | None = None, end_date: datetime | None = None) -> BalanceResponse:
        stmt = select(
            func.coalesce(func.sum(Receipt.income), 0).label('total_income'),
            func.coalesce(func.sum(Receipt.expense), 0).label('total_expense'),
            func.coalesce(func.sum(Receipt.discount), 0).label('total_discount')
        )
        if start_date is not None:
            stmt = stmt.where(Receipt.transaction_at >= start_date)
        if end_date is not None:
            stmt = stmt.where(Receipt.transaction_at <= end_date)
        
        row = self.db.execute(stmt).first()
        
        return BalanceResponse(
            total_income=row.total_income,
            total_expense=row.total_expense,
            total_discount=row.total_discount,
            total_balance=row.total_income - row.total_expense + row.total_discount
        )