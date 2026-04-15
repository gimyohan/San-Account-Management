from pydantic import BaseModel, ConfigDict

class QuarterRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
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