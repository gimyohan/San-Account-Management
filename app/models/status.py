from pydantic import BaseModel

class BalanceResponse(BaseModel):
    total_income: int
    total_expense: int
    total_discount: int
    total_balance: int