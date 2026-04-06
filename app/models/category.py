from pydantic import BaseModel

class CategoryRead(BaseModel):
    id: int
    name: str
    parent_id: int | None = None
    level: int

class CategoryTreeRead(BaseModel):
    id: int
    name: str
    parent_id: int | None = None
    children: list["CategoryTreeRead"] | None = None

class CategoryCreate(BaseModel):
    name: str
    parent_id: int | None = None