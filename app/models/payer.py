from pydantic import BaseModel

class PayerRead(BaseModel):
    id: int
    name: str
    account: str

class PayerCrate(BaseModel):
    name: str
    account: str | None = None