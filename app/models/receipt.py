from datetime import datetime
from pydantic import BaseModel, field_validator, model_validator

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
    payer_id: int | None
    description: str
    income: int = 0
    expense: int = 0
    discount: int = 0
    people_count: int = 1
    receipt_url: str | None
    is_transferred: bool = False
    transaction_at: datetime
    transferred_at: datetime | None


    @model_validator(mode="before")
    @classmethod
    def validate_income_expense(cls, data):
        if data.get('income', 0) > 0 and data.get('expense', 0) > 0:
            raise ValueError('수입과 지출은 동시에 0보다 클 수 없습니다.')
        if data.get('income', 0) == 0 and data.get('expense', 0) == 0:
            raise ValueError('수입과 지출은 동시에 0일 수 없습니다.')
        return data



    @field_validator('income', 'expense', 'discount')
    @classmethod
    def validate_positive(cls, v: int) -> int:
        if v < 0:
            raise ValueError('금액은 음수일 수 없습니다.')
        return v

    @field_validator('people_count')
    @classmethod
    def validate_people_count(cls, v: int) -> int:
        if v < 1:
            raise ValueError('인원은 1명 이상이어야 합니다.')
        return v



    @model_validator(mode="after")
    def validate_expense(self):
        # 할인액 제한
        if self.expense < self.discount:
            raise ValueError('할인액은 지출액보다 클 수 없습니다.')
        return self

    @model_validator(mode="after")
    def validate_payer_id(self):
        # 지출이 있는 경우 결제인은 필수
        if self.expense > 0 and self.payer_id is None:
            raise ValueError('지출이 있는 경우 결제인은 필수입니다.')
        return self

    @model_validator(mode="after")
    def pre_process_income(self):
        if self.income > 0:
            self.payer_id = None
            self.discount = 0
            self.people_count = 1
            self.is_transferred = True
            self.transferred_at = datetime.utcnow()
        return self