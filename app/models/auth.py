from pydantic import BaseModel, ConfigDict
from datetime import datetime

class RoleRead(BaseModel):
    role: str

class CodeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True) 
    id: int
    code: str
    role: str
    memo: str
    access_count: int
    last_accessed_at: datetime | None = None

class CodePrevMemoRead(CodeRead):
    prev_memo: str = ""

class CodeMemoUpdate(BaseModel):
    memo: str = ""

class CodeListRead(BaseModel):
    total: int
    offset: int
    limit: int
    sort_key: str
    codes: list[CodeRead]