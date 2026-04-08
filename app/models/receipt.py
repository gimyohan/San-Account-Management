from datetime import datetime
from pydantic import BaseModel

class ReceiptRead(BaseModel):
    id: int
    category_id: int | None
    payer_id: int
    description: str
    income: int = 0
    expense: int = 0
    discount: int = 0
    people_count: int = 1
    receipt_url: str | None
    is_transferred: bool = False
    transaction_at: datetime
    transferred_at: datetime | None

class ReceiptCreate(BaseModel):
    category_id: int | None
    payer_id: int
    description: str
    income: int = 0
    expense: int = 0
    discount: int = 0
    people_count: int = 1
    receipt_url: str | None
    is_transferred: bool = False
    transaction_at: datetime
    transferred_at: datetime | None