from fastapi import APIRouter, Depends, status

from app.db.schema import get_db
from app.models.response import SuccessResponse
from app.models.category import CategoryCreate, CategoryTreeRead, CategoryRead, CategoryOrderUpdate, BudgetBulkUpdate
from app.services.category_service import CategoryService
from app.core.exception import ForbiddenException
from app.core import auth

router = APIRouter(prefix="/categories", tags=["categories"])


def get_category_service(db=Depends(get_db)) -> CategoryService:
    return CategoryService(db)

@router.get("", status_code=status.HTTP_200_OK, response_model = SuccessResponse[list[CategoryTreeRead]])
async def get_category_tree(year_id: int, service: CategoryService = Depends(get_category_service), role: str = Depends(auth.get_current_user)):
    if role not in ["admin", "general"]:
        raise ForbiddenException()
    return SuccessResponse(data=service.get_category_tree(year_id))

@router.get("/{id}", status_code=status.HTTP_200_OK, response_model=SuccessResponse[CategoryRead])
async def get_category(id: int, service: CategoryService = Depends(get_category_service), role: str = Depends(auth.get_current_user)):
    if role not in ["admin", "general"]:
        raise ForbiddenException()
    return SuccessResponse(data=service.get_category(id))

@router.post("", status_code=status.HTTP_201_CREATED, response_model=SuccessResponse[CategoryRead])
async def create_category(request: CategoryCreate, service: CategoryService = Depends(get_category_service), role: str = Depends(auth.get_current_user)) -> SuccessResponse[CategoryRead]:
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(
        data=service.create_category(request),
        message="분류가 성공적으로 추가되었습니다."
    )

@router.patch("/{id}", status_code=status.HTTP_200_OK, response_model=SuccessResponse[CategoryRead])
async def update_category(id: int, category: CategoryCreate, service: CategoryService = Depends(get_category_service), role: str = Depends(auth.get_current_user)):
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(
        data=service.update_category(id, category),
        message="분류가 성공적으로 수정되었습니다."
    )

@router.patch("/{id}/reorder", status_code=status.HTTP_200_OK, response_model=SuccessResponse[CategoryRead])
async def update_category_reorder(id: int, request: CategoryOrderUpdate, service: CategoryService = Depends(get_category_service), role: str = Depends(auth.get_current_user)):
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(
        data=service.update_category_reorder(id, request),
        message="분류 순서가 성공적으로 변경되었습니다."
    )

@router.patch("/budgets/bulk", status_code=status.HTTP_200_OK, response_model=SuccessResponse[CategoryRead])
async def update_category_budgets(request: BudgetBulkUpdate, service: CategoryService = Depends(get_category_service), role: str = Depends(auth.get_current_user)):
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(
        data=service.update_category_budgets(request),
        message="예산이 성공적으로 변경되었습니다."
    )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(id: int, service: CategoryService = Depends(get_category_service), role: str = Depends(auth.get_current_user)):
    if role != "admin":
        raise ForbiddenException()
    service.delete_category(id)