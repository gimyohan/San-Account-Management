from pydantic import BaseModel, field_validator

class BudgetCreate(BaseModel):
    category_id: int
    fiscal_term_id: int
    amount: int

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: int) -> int:
        if v < 0:
            raise ValueError("예산은 0보다 크거나 같아야 합니다.")
        return v
    
class BudgetResponse(BaseModel):
    id: int
    category_id: int
    fiscal_term_id: int
    amount: int