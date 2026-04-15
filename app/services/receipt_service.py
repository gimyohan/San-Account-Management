from fastapi import HTTPException
from starlette import status

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.schema import Receipt, Category, Payer, Quarter
from app.models.receipt import ReceiptRead, ReceiptCreate
from app.core.exception import NotFoundException, ConflictException

from datetime import datetime

class ReceiptService:
    def __init__(self, session: Session):
        self.db = session

    def _to_receipt_read(self, receipt: Receipt) -> ReceiptRead:
        return ReceiptRead(
            id=receipt.id,
            category_id=receipt.category_id,
            payer_id=receipt.payer_id,
            quarter_id=receipt.quarter_id,
            description=receipt.description,
            income=receipt.income,
            expense=receipt.expense,
            discount=receipt.discount,
            people_count=receipt.people_count,
            receipt_url=receipt.receipt_url,
            is_transferred=receipt.is_transferred,
            transaction_at=receipt.transaction_at,
            transferred_at=receipt.transferred_at
        )

    def get_receipts(self, 
        year_id: int | None = None,
        quarter_id: int | None = None,
        start_date: datetime | None = None, 
        end_date: datetime | None = None, 
        category_id: int | None = None, 
        payer_id: int | None = None, 
        is_transferred: bool | None = None
    ) -> list[ReceiptRead]:
        stmt = select(Receipt)
        if year_id is not None:
            stmt = stmt.join(Receipt.quarter).where(Quarter.year_id == year_id)
        if quarter_id is not None:
            stmt = stmt.where(Receipt.quarter_id == quarter_id)
        if start_date is not None and end_date is not None:
            stmt = stmt.where(Receipt.transaction_at >= start_date, Receipt.transaction_at <= end_date)
        if category_id is not None:
            stmt = stmt.where(Receipt.category_id == category_id)
        if payer_id is not None:
            stmt = stmt.where(Receipt.payer_id == payer_id)
        if is_transferred is not None:
            stmt = stmt.where(Receipt.is_transferred == is_transferred)
        stmt = stmt.order_by(Receipt.transaction_at.desc())
        receipts = self.db.scalars(stmt).all()
        return receipts

    def get_receipt(self, id: int) -> ReceiptRead:
        stmt = select(Receipt).where(Receipt.id == id)
        receipt = self.db.scalars(stmt).first()
        if not receipt:
            raise NotFoundException("영수증을 찾을 수 없습니다.")
        return receipt

    def create_receipt(self, request: ReceiptCreate) -> ReceiptRead:
        if request.category_id is not None and self.db.scalar(select(Category).where(Category.id == request.category_id)) is None:
            raise NotFoundException("카테고리를 찾을 수 없습니다.")
        if request.payer_id is not None and self.db.scalar(select(Payer).where(Payer.id == request.payer_id)) is None:
            raise NotFoundException("결제인을 찾을 수 없습니다.")
        if request.quarter_id is not None and self.db.scalar(select(Quarter).where(Quarter.id == request.quarter_id)) is None:
            raise NotFoundException("분기를 찾을 수 없습니다.")
        if request.quarter_id is not None and request.category_id is not None and self.db.scalar(select(Category).where(Category.id == request.category_id)).year_id != self.db.scalar(select(Quarter).where(Quarter.id==request.quarter_id)).year_id:
            raise ConflictException("카테고리와 분기의 연도가 일치하지 않습니다.")

        receipt = Receipt(
            category_id=request.category_id,
            payer_id=request.payer_id,
            quarter_id=request.quarter_id,
            description=request.description,
            income=request.income,
            expense=request.expense,
            discount=request.discount,
            people_count=request.people_count,
            receipt_url=request.receipt_url,
            is_transferred=request.is_transferred,
            transaction_at=request.transaction_at,
            transferred_at=request.transferred_at
        )
        self.db.add(receipt)
        self.db.commit()
        self.db.refresh(receipt)
        return self._to_receipt_read(receipt)
        
    def update_receipt(self, id: int, request: ReceiptCreate) -> ReceiptRead:
        receipt = self.get_receipt(id)
        if request.category_id is not None and self.db.scalar(select(Category).where(Category.id == request.category_id)) is None:
            raise NotFoundException("카테고리를 찾을 수 없습니다.")
        if request.payer_id is not None and self.db.scalar(select(Payer).where(Payer.id == request.payer_id)) is None:
            raise NotFoundException("결제인을 찾을 수 없습니다.")
        if request.quarter_id is not None and self.db.scalar(select(Quarter).where(Quarter.id == request.quarter_id)) is None:
            raise NotFoundException("분기를 찾을 수 없습니다.")
        if request.quarter_id is not None and request.category_id is not None and self.db.scalar(select(Category).where(Category.id == request.category_id)).year_id != self.db.scalar(select(Quarter).where(Quarter.id==request.quarter_id)).year_id:
            raise ConflictException("카테고리와 분기의 연도가 일치하지 않습니다.")
        receipt.category_id = request.category_id
        receipt.payer_id = request.payer_id
        receipt.quarter_id = request.quarter_id
        receipt.description = request.description
        receipt.income = request.income
        receipt.expense = request.expense
        receipt.discount = request.discount
        receipt.people_count = request.people_count
        receipt.receipt_url = request.receipt_url
        receipt.is_transferred = request.is_transferred
        receipt.transaction_at = request.transaction_at
        receipt.transferred_at = request.transferred_at
        self.db.commit()
        self.db.refresh(receipt)
        return self._to_receipt_read(receipt)

    def delete_receipt(self, id: int):
        receipt = self.db.scalar(select(Receipt).where(Receipt.id == id))
        if not receipt:
            raise NotFoundException("영수증을 찾을 수 없습니다.")
        self.db.delete(receipt)
        self.db.commit()