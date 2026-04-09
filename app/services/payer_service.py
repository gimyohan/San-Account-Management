from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.schema import Payer
from app.models.payer import PayerRead
from app.core.exception import NotFoundException, ConflictException


class PayerService:
    def __init__(self, session: Session):
        self.db = session

    def get_payers(self) -> list[PayerRead]:
        payers = self.db.scalars(select(Payer)).all()
        return payers

    def create_payer(self, name: str, account: str | None) -> PayerRead:
        payer = Payer(name=name)
        if account: payer.account = account
        self.db.add(payer)
        self.db.commit()
        self.db.refresh(payer)
        return PayerRead(id=payer.id, name=payer.name, account=payer.account)

    def update_payer(self, id: int, name: str, account: str | None) -> PayerRead:
        payer = self.db.get(Payer, id)
        if not payer:
            raise NotFoundException("결제인을 찾을 수 없습니다.")
        payer.name = name
        if account: payer.account = account
        self.db.commit()
        self.db.refresh(payer)
        return PayerRead(id=payer.id, name=payer.name, account=payer.account)

    def delete_payer(self, id: int) -> None:
        payer = self.db.get(Payer, id)
        if not payer:
            raise NotFoundException("결제인을 찾을 수 없습니다.")
        if payer.receipts != []:
            raise ConflictException("연결된 영수증 내역이 존재하여 삭제할 수 없습니다.", "HAS_RECEIPTS")
        self.db.delete(payer)
        self.db.commit()