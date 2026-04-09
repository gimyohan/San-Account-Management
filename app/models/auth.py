from pydantic import BaseModel
from datetime import datetime

class RoleRead(BaseModel):
    role: str

class CodeRead(BaseModel):
    id: int
    code: str
    role: str
    memo: str
    access_count: int
    last_accessed_at: datetime | None = None

class CodeUpdate(BaseModel):
    memo: str