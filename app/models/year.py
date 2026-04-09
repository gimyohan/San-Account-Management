from pydantic import BaseModel

class YearRead(BaseModel):
    id: int
    year: int
    name: str | None

class YearCreate(BaseModel):
    year: int
    name: str | None
