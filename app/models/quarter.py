from pydantic import BaseModel

class QuarterRead(BaseModel):
    id: int
    order: int
    name: str
    year_id: int

class QuarterCreate(BaseModel):
    order: int
    name: str
    year_id: int

class QuarterUpdate(BaseModel):
    order: int
    name: str | None = None