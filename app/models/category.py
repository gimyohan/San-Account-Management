from pydantic import BaseModel

class CategoryRead(BaseModel):
    id: int
    name: str
    level: int
    sibling_order: int
    amount: int
    parent_id: int | None = None
    year_id: int

class CategoryTreeRead(BaseModel):
    id: int
    name: str
    level: int
    sibling_order: int
    amount: int
    parent_id: int | None = None
    year_id: int
    children: list["CategoryTreeRead"] | None = None

class CategoryCreate(BaseModel):
    name: str
    amount: int
    sibling_order: int
    parent_id: int | None = None
    year_id: int

class CategoryUpdate(BaseModel):
    name: str
    amount: int
    sibling_order: int
    parent_id: int | None = None

class CategoryOrderUpdate(BaseModel):
    sibling_order: int

# class CategoryTreeCreate(BaseModel):
#     name: str
#     amount: int
#     parent_id: int | None = None
#     fiscal_term_id: int
#     children: list["CategoryTreeCreate"] | None = None

class BudgetBulkUpdateItem(BaseModel):
    id: int
    amount: int

class BudgetBulkUpdate(BaseModel):
    items: list[BudgetBulkUpdateItem]

