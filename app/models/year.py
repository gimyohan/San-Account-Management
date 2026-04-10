from pydantic import BaseModel, ConfigDict

class YearRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    year: int
    name: str | None

class YearCreate(BaseModel):
    year: int
    name: str | None
