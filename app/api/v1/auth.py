from fastapi import APIRouter, Depends, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from app.db.schema import get_db
from app.models.response import SuccessResponse, ErrorResponse
from app.models.auth import Role, CodeRead, CodeUpdate
from app.services.auth_service import AuthService
from app.core.config import config
from app.core.exception import ForbiddenException
from app.core import auth

router = APIRouter(prefix="/auth", tags=["auth"])

def get_auth_service(db=Depends(get_db)) -> AuthService:
    return AuthService(db)

@router.post("/login", status_code=status.HTTP_200_OK, response_model = SuccessResponse[Role])
async def login_for_access_token(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), service: AuthService = Depends(get_auth_service)) -> SuccessResponse[Role]:
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
    return SuccessResponse(data=Role(role=form_data.username), message="로그인에 성공하였습니다.")

@router.post("/logout", status_code=status.HTTP_200_OK, response_model=SuccessResponse[None])
async def logout(response: Response) -> SuccessResponse[None]:
    response.set_cookie(
        key="access_token",
        value="",
        httponly=True,
        secure=not config.debug,
        samesite="lax" if config.debug else "strict",
        path="/",
        max_age=0
    )
    return SuccessResponse(data=None, message="로그아웃되었습니다.")

@router.get("/me", status_code=status.HTTP_200_OK, response_model=SuccessResponse[Role])
async def get_current_user(role: str = Depends(auth.get_current_user)) -> SuccessResponse[Role]:
    return SuccessResponse(data=Role(role=role))


@router.get("/codes", status_code=status.HTTP_200_OK, response_model=SuccessResponse[list[CodeRead]])
async def get_codes(limit: int = 5, service: AuthService = Depends(get_auth_service), role: str = Depends(auth.get_current_user)) -> SuccessResponse[list[CodeRead]]:
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(data=service.get_codes(limit))

@router.post("/codes", status_code=status.HTTP_201_CREATED, response_model=SuccessResponse[CodeRead])
async def create_code(service: AuthService = Depends(get_auth_service), role: str = Depends(auth.get_current_user)) -> SuccessResponse[CodeRead]:
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(data=service.create_code(), message="새로운 액세스 코드가 발급되었습니다.")

@router.patch("/codes/{id}", status_code=status.HTTP_200_OK, response_model=SuccessResponse[CodeRead])
async def update_code(id: int, payload: CodeUpdate, service: AuthService = Depends(get_auth_service), role: str = Depends(auth.get_current_user)) -> SuccessResponse[CodeRead]:
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(data=service.update_code_memo(id, payload.memo), message="메모가 저장되었습니다.")

@router.delete("/codes/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_code(id: int, service: AuthService = Depends(get_auth_service), role: str = Depends(auth.get_current_user)):
    if role != "admin":
        raise ForbiddenException()
    service.delete_code(id)