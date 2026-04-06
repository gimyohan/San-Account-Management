from fastapi import Request
from jose import jwt, JWTError
from app.core.config import config
from app.exception.auth import InvalidCodeException

def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise InvalidCodeException("로그인이 필요합니다.")
    try:
        payload = jwt.decode(token, config.jwt_secret_key, algorithms=[config.jwt_algorithm])
        role: str = payload.get("role")
        if role is None:
            raise InvalidCodeException("역할이 유효하지 않습니다.")
        return role
    except JWTError:
        raise InvalidCodeException("토큰이 유효하지 않습니다.")