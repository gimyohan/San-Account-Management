from fastapi import APIRouter, Depends, Response

from app.db.schema import get_db
from app.models.response import SuccessResponse, ErrorResponse
from app.models.category import CategoryCreate, CategoryTreeRead, CategoryRead
from app.services.category_service import CategoryService
from app.exception.auth import ForbiddenException
from app.core import auth

from starlette import status

router = APIRouter(prefix="/categories", tags=["categories"])


def get_category_service(db=Depends(get_db)) -> CategoryService:
    return CategoryService(db)

@router.get("/", response_model = SuccessResponse[list[CategoryTreeRead]])
async def get_category_tree(service: CategoryService = Depends(get_category_service), role: str = Depends(auth.get_current_user)) -> SuccessResponse[list[CategoryTreeRead]]:
    if role not in ["admin", "general"]:
        raise ForbiddenException()
    return SuccessResponse(data=service.get_category_tree())

@router.get("/{id}", response_model=SuccessResponse[CategoryRead])
async def get_category(id: int, service: CategoryService = Depends(get_category_service), role: str = Depends(auth.get_current_user)) -> SuccessResponse[CategoryRead]:
    if role not in ["admin", "general"]:
        raise ForbiddenException()
    return SuccessResponse(data=service.get_category(id))

@router.post("/", response_model=SuccessResponse[CategoryRead])
async def create_category(category: CategoryCreate, service: CategoryService = Depends(get_category_service), role: str = Depends(auth.get_current_user)) -> SuccessResponse[CategoryRead]:
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(
        data=service.create_category(name=category.name, parent_id=category.parent_id),
        message="분류가 성공적으로 추가되었습니다."
    )

@router.patch("/{id}")
async def update_category(id: int, category: CategoryCreate, service: CategoryService = Depends(get_category_service), role: str = Depends(auth.get_current_user)):
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(
        data=service.update_category(id, category.name, category.parent_id),
        message="분류가 성공적으로 수정되었습니다."
    )

@router.delete("/{id}")
async def delete_category(id: int, service: CategoryService = Depends(get_category_service), role: str = Depends(auth.get_current_user)):
    if role != "admin":
        raise ForbiddenException()
    service.delete_category(id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)