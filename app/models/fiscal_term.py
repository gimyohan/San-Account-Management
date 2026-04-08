from pydantic import BaseModel, model_validator

from datetime import datetime

class FiscalTermResponse(BaseModel):
    id: int
    name: str
    start_date: datetime
    end_date: datetime

class FiscalTermCrate(BaseModel):
    name: str
    start_date: datetime
    end_date: datetime

    @model_validator(mode="after")
    def validate_fiscal_term(self):
        if self.start_date > self.end_date:
            raise ValueError("시작일은 종료보다 빨라야 합니다.")
        return self