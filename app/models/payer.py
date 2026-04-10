from pydantic import BaseModel, ConfigDict

class PayerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    account: str

class PayerCrate(BaseModel):
    name: str
    account: str | None = None

class PayerUpdate(BaseModel):
    name: str | None = None
    account: str | None = None