from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.schema import Payer
from app.models import payer as model
from app.core.exception import NotFoundException, ConflictException


class PayerService:
    def __init__(self, session: Session):
        self.db = session

    def get_payers(self) -> list[model.PayerRead]:
        payers = self.db.scalars(select(Payer)).all()
        return [model.PayerRead.model_validate(payer) for payer in payers]

    def get_payer(self, id: int) -> model.PayerRead:
        payer = self.db.scalar(select(Payer).where(Payer.id == id))
        if not payer:
            raise NotFoundException("결제인을 찾을 수 없습니다.")
        return model.PayerRead.model_validate(payer)

    def create_payer(self, request: model.PayerCrate) -> model.PayerRead:
        payer = Payer(name=request.name)
        if request.account: payer.account = request.account
        self.db.add(payer)
        self.db.commit()
        self.db.refresh(payer)
        return model.PayerRead.model_validate(payer)

    def update_payer(self, id: int, request: model.PayerUpdate) -> model.PayerRead:
        payer = self.db.get(Payer, id)
        if not payer:
            raise NotFoundException("결제인을 찾을 수 없습니다.")
        if request.name is not None: payer.name = request.name
        if request.account is not None: payer.account = request.account
        self.db.commit()
        self.db.refresh(payer)
        return model.PayerRead.model_validate(payer)

    def delete_payer(self, id: int) -> None:
        payer = self.db.get(Payer, id)
        if not payer:
            raise NotFoundException("결제인을 찾을 수 없습니다.")
        if payer.receipts:
            raise ConflictException("연결된 영수증 내역이 존재하여 삭제할 수 없습니다.", "HAS_RECEIPTS")
        self.db.delete(payer)
        self.db.commit()