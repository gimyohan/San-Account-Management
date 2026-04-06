from pydantic import BaseModel
from typing import TypeVar, Generic

T = TypeVar("T")

class SuccessResponse(BaseModel, Generic[T]):
    data: T
    message: str | None = None

class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
    path: str | None = None