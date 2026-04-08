from pydantic import BaseModel
from datetime import datetime

class Role(BaseModel):
    role: str

class CodeRead(BaseModel):
    id: int
    code: str
    memo: str | None = None
    access_count: int
    last_accessed_at: datetime | None = None

class CodeUpdate(BaseModel):
    memo: str | None = None