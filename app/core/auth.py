from fastapi import Request
from jose import jwt, JWTError
from app.core.config import config
from app.models.auth import RoleRead
from app.core.exception import InvalidException, UnauthorizedException

def get_current_user(request: Request) -> str:
    token = request.cookies.get("access_token")
    if not token:
        raise UnauthorizedException("로그인이 필요합니다.", "UNAUTHORIZED")
    try:
        payload = jwt.decode(token, config.jwt_secret_key, algorithms=[config.jwt_algorithm])
        role: str = payload.get("role")
        if role is None:
            raise InvalidException("역할이 유효하지 않습니다.", "INVALID_ROLE")
        return role
    except JWTError:
        raise InvalidException("토큰이 유효하지 않습니다.", "INVALID_TOKEN")