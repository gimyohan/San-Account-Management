from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.schema import Code
from app.models.auth import CodeRead
from app.core.exception import NotFoundException, ConflictException, UnprocessableEntityException
from app.core.config import config

from datetime import datetime, timedelta
from jose import jwt
from random import choice

class AuthService:
    def __init__(self, session: Session):
        self.db = session
        self.code_domain = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    
    def create_access_token(self, role: str, code: str) -> str:
        code = self.db.scalar(select(Code).where(Code.role == role, Code.code == code))
        if not code:
            raise NotFoundException("유효하지 않은 코드입니다. 다시 확인해주세요.", "NOT_FOUND")
        code.last_accessed_at = datetime.utcnow()
        code.access_count += 1
        self.db.commit()
        self.db.refresh(code)
        to_encode = {
            "sub": str(code.id),
            "role": code.role,
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(minutes = config.jwt_access_token_expire_minutes)
        }
        access_token = jwt.encode(to_encode, config.jwt_secret_key, algorithm=config.jwt_algorithm)
        return access_token
        
    def get_codes(self, limit: int) -> list[CodeRead]:
        if limit < 0:
            raise UnprocessableEntityException("limit은 0 이상의 길이어야 합니다.", "INVALID_LIMIT")
        codes = self.db.scalars(
            select(Code)
            .where(Code.role == "general")
            .order_by(Code.last_accessed_at.desc().nulls_last())
            .limit(limit)
        ).all()
        return codes

    def create_code(self) -> CodeRead:
        code = Code(role="general", code="".join(choice(self.code_domain) for _ in range(6)))
        self.db.add(code)
        self.db.commit()
        self.db.refresh(code)
        return code

    def update_code_memo(self, id: int, memo: str | None) -> CodeRead:
        code = self.db.scalar(select(Code).where(Code.id == id))
        if not code:
            raise NotFoundException("존재하지 않는 코드입니다.", "NOT_FOUND")
        if code.role == "admin":
            raise ConflictException("관리자 코드는 수정할 수 없습니다.", "CANNOT_UPDATE_ADMIN")
        
        code.memo = memo
        self.db.commit()
        self.db.refresh(code)
        return code

    def delete_code(self, id):
        code = self.db.scalar(select(Code).where(Code.id == id))
        if not code:
            raise NotFoundException("존재하지 않는 코드입니다.", "NOT_FOUND")
        if code.role == "admin":
            raise ConflictException("관리자 코드는 삭제할 수 없습니다.", "CANNOT_DELETE_ADMIN")
        self.db.delete(code)
        self.db.commit()
        return