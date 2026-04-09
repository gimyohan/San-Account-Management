from fastapi import APIRouter, Depends, Response, status, Query
from fastapi.security import OAuth2PasswordRequestForm

from app.db.schema import get_db
from app.models.response import SuccessResponse
from app.models import auth as model
from app.models.auth import RoleRead, CodeMemoUpdate
from app.services.auth_service import AuthService
from app.core.config import config
from app.core.exception import ForbiddenException
from app.core import auth

router = APIRouter(prefix="/auth", tags=["auth"])

def get_auth_service(db=Depends(get_db)) -> AuthService:
    return AuthService(db)

@router.post("/login", status_code=status.HTTP_200_OK, response_model = SuccessResponse[RoleRead])
def login_for_access_token(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), service: AuthService = Depends(get_auth_service)):
    token = service.create_access_token(form_data.username, form_data.password)

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=not config.debug,
        samesite="lax" if config.debug else "strict",
        path="/",
        max_age=config.jwt_access_token_expire_minutes * 60
    )
    return SuccessResponse(data=RoleRead(role=form_data.username), message="로그인에 성공하였습니다.")

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response):
    response.set_cookie(
        key="access_token",
        value="",
        httponly=True,
        secure=not config.debug,
        samesite="lax" if config.debug else "strict",
        path="/",
        max_age=0
    )
    return

@router.get("/me", status_code=status.HTTP_200_OK, response_model=SuccessResponse[RoleRead])
def get_current_user(role: str = Depends(auth.get_current_user)):
    return SuccessResponse(data=RoleRead(role=role))

@router.get("/codes", status_code=status.HTTP_200_OK, response_model=SuccessResponse[model.CodeListRead])
def get_codes(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=5, ge=0),
    sort_key: str = Query(default="last_accessed_at", pattern="^(last_accessed_at|access_count|code)$"),
    service: AuthService = Depends(get_auth_service), 
    role: str = Depends(auth.get_current_user)
):
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(data=service.get_codes(offset, limit, sort_key))

@router.post("/codes", status_code=status.HTTP_201_CREATED, response_model=SuccessResponse[model.CodeRead])
def create_code(
    custom_code: str | None = Query(default=None, min_length=4, max_length=32),
    memo: str = Query(default="", max_length=255),
    length: int = Query(default=4, ge=4, le=32),
    service: AuthService = Depends(get_auth_service), role: str = Depends(auth.get_current_user)):
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(data=service.create_code(custom_code, memo, length), message="새로운 액세스 코드가 발급되었습니다.")

@router.patch("/codes/{id}/memo", status_code=status.HTTP_200_OK, response_model=SuccessResponse[model.CodePrevMemoRead])
def update_code(
    id: int, 
    request: CodeMemoUpdate, 
    service: AuthService = Depends(get_auth_service), 
    role: str = Depends(auth.get_current_user)
):
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(data=service.update_code_memo(id, request), message="메모가 저장되었습니다.")

@router.delete("/codes/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_code(
    id: int, 
    service: AuthService = Depends(get_auth_service), 
    role: str = Depends(auth.get_current_user)
):
    if role != "admin":
        raise ForbiddenException()
    service.delete_code(id)