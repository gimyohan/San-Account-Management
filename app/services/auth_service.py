from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.schema import Code
from app.models.auth import CodeRead
from app.core.exception import NotFoundException, ConflictException
from app.core.config import config

from datetime import datetime, timedelta
from jose import jwt
from random import choice

class AuthService:
    def __init__(self, session: Session):
        self.db = session
        self.code_domain = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    
    def create_access_token(self, type: str, code: str) -> str:
        user = self.db.scalar(select(Code).where(Code.type == type, Code.code == code))
        if not user:
            raise NotFoundException("유효하지 않은 코드입니다. 다시 확인해주세요.", "INVALID_CODE")
        user.last_accessed_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)
        to_encode = {
            "sub": str(user.id),
            "role": user.type,
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(minutes = config.jwt_access_token_expire_minutes)
        }
        access_token = jwt.encode(to_encode, config.jwt_secret_key, algorithm=config.jwt_algorithm)
        return access_token
        
    def get_codes(self) -> list[CodeRead]:
        codes = self.db.scalars(select(Code).where(Code.type == "general")).all()
        return [CodeRead(id=code.id, code=code.code, memo=code.memo, last_accessed_at=code.last_accessed_at) for code in codes]

    def create_code(self) -> CodeRead:
        code = Code(type="general", code="".join(choice(self.code_domain) for _ in range(6)))
        self.db.add(code)
        self.db.commit()
        self.db.refresh(code)
        return CodeRead(id=code.id, code=code.code, memo=code.memo, last_accessed_at=code.last_accessed_at)

    def delete_code(self, id):
        code = self.db.scalar(select(Code).where(Code.id == id))
        if not code:
            raise NotFoundException("유효하지 않은 코드입니다. 다시 확인해주세요.", "INVALID_CODE")
        if code.type == "admin":
            raise ConflictException("관리자 코드는 삭제할 수 없습니다.", "CANNOT_DELETE_ADMIN")
        self.db.delete(code)
        self.db.commit()
        return

    def update_code_memo(self, id: int, memo: str | None) -> CodeRead:
        code = self.db.scalar(select(Code).where(Code.id == id))
        if not code:
            raise NotFoundException("유효하지 않은 코드입니다. 다시 확인해주세요.", "INVALID_CODE")
        if code.type == "admin":
            raise ConflictException("관리자 코드는 수정할 수 없습니다.", "CANNOT_UPDATE_ADMIN")
        
        code.memo = memo
        self.db.commit()
        self.db.refresh(code)
        return CodeRead(id=code.id, code=code.code, memo=code.memo, last_accessed_at=code.last_accessed_at)
