from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.db.schema import Code
from app.models import auth as model
from app.core.exception import NotFoundException, ConflictException
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
        
    def get_codes(self, offset: int, limit: int, sort_key: str) -> model.CodeListRead:
        if sort_key == "last_accessed_at":
            order_key = Code.last_accessed_at.desc().nulls_last()
        elif sort_key == "access_count":
            order_key = Code.access_count.desc().nulls_last()
        elif sort_key == "code":
            order_key = Code.code.asc()
        codes = self.db.scalars(
            select(Code)
            .where(Code.role == "general")
            .order_by(order_key)
            .limit(limit)
            .offset(offset)
        ).all()
        return model.CodeListRead(
            total = self.db.scalar(select(func.count(Code.id)).where(Code.role == "general")),
            offset = offset,
            limit = limit,
            sort_key = sort_key,
            codes = [model.CodeRead.model_validate(code) for code in codes]
        )

    def create_code(self, code: str | None, memo: str, length: int) -> model.CodeRead:
        if code is None:
            code = "".join(choice(self.code_domain) for _ in range(length))
        if self.db.scalar(select(Code).where(Code.code == code)):
            raise ConflictException("이미 존재하는 코드입니다.", "CODE_EXISTS")
        code = Code(role="general", code=code, memo=memo)
        self.db.add(code)
        self.db.commit()
        self.db.refresh(code)
        return model.CodeRead.model_validate(code)

    def update_code_memo(self, id: int, request: model.CodeMemoUpdate) -> model.CodePrevMemoRead:
        code = self.db.scalar(select(Code).where(Code.id == id))
        if not code:
            raise NotFoundException("존재하지 않는 코드입니다.", "NOT_FOUND")
        if code.role == "admin":
            raise ConflictException("관리자 코드는 수정할 수 없습니다.", "CANNOT_UPDATE_ADMIN")
        prev_memo = code.memo
        code.memo = request.memo
        self.db.commit()
        self.db.refresh(code)
        res = model.CodePrevMemoRead.model_validate(code)
        res.prev_memo = prev_memo
        return res

    def delete_code(self, id):
        code = self.db.scalar(select(Code).where(Code.id == id))
        if not code:
            raise NotFoundException("존재하지 않는 코드입니다.", "NOT_FOUND")
        if code.role == "admin":
            raise ConflictException("관리자 코드는 삭제할 수 없습니다.", "CANNOT_DELETE_ADMIN")
        self.db.delete(code)
        self.db.commit()
        return