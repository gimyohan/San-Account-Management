from app.exception.auth import ForbiddenException
from fastapi import APIRouter, Depends, Response
from fastapi.security import OAuth2PasswordRequestForm

from app.db.schema import get_db
from app.models.response import SuccessResponse, ErrorResponse
from app.models.auth import Role, CodeRead, CodeUpdate
from app.services.auth_service import AuthService
from app.core.config import config
from app.core import auth

router = APIRouter(prefix="/auth", tags=["auth"])

def get_auth_service(db=Depends(get_db)) -> AuthService:
    return AuthService(db)

@router.post("/login", response_model = SuccessResponse[Role])
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

@router.post("/logout", response_model=SuccessResponse[None])
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

@router.get("/me", response_model=SuccessResponse[Role])
async def get_current_user(role: str = Depends(auth.get_current_user)) -> SuccessResponse[Role]:
    return SuccessResponse(data=Role(role=role))


@router.get("/codes", response_model=SuccessResponse[list[CodeRead]])
async def get_codes(service: AuthService = Depends(get_auth_service), role: str = Depends(auth.get_current_user)) -> SuccessResponse[list[CodeRead]]:
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(data=service.get_codes())

@router.post("/codes", response_model=SuccessResponse[CodeRead])
async def create_code(service: AuthService = Depends(get_auth_service), role: str = Depends(auth.get_current_user)) -> SuccessResponse[CodeRead]:
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(data=service.create_code(), message="새로운 액세스 코드가 발급되었습니다.")

@router.patch("/codes/{id}", response_model=SuccessResponse[CodeRead])
async def update_code(id: int, payload: CodeUpdate, service: AuthService = Depends(get_auth_service), role: str = Depends(auth.get_current_user)) -> SuccessResponse[CodeRead]:
    if role != "admin":
        raise ForbiddenException()
    return SuccessResponse(data=service.update_code_memo(id, payload.memo), message="메모가 저장되었습니다.")

@router.delete("/codes/{id}")
async def delete_code(id: int, service: AuthService = Depends(get_auth_service), role: str = Depends(auth.get_current_user)) -> SuccessResponse[None]:
    if role != "admin":
        raise ForbiddenException()
    service.delete_code(id)
    return Response(status_code=204)