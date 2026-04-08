from fastapi import HTTPException
from starlette import status

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.schema import Receipt, Category, Payer
from app.models.receipt import ReceiptRead, ReceiptCreate
from app.core.exception import NotFoundException

from datetime import datetime

class ReceiptService:
    def __init__(self, session: Session):
        self.db = session

    def _to_receipt_read(self, receipt: Receipt) -> ReceiptRead:
        return ReceiptRead(
            id=receipt.id,
            category_id=receipt.category_id,
            payer_id=receipt.payer_id,
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
        start_date: datetime | None = None, 
        end_date: datetime | None = None, 
        category_id: int | None = None, 
        payer_id: int | None = None, 
        is_transferred: bool | None = None
    ) -> list[ReceiptRead]:
        stmt = select(Receipt)
        if start_date is not None and end_date is not None:
            stmt = stmt.where(Receipt.transaction_at >= start_date, Receipt.transaction_at <= end_date)
        if category_id is not None:
            stmt = stmt.where(Receipt.category_id == category_id)
        if payer_id is not None:
            stmt = stmt.where(Receipt.payer_id == payer_id)
        if is_transferred is not None:
            stmt = stmt.where(Receipt.is_transferred == is_transferred)
        receipts = self.db.scalars(stmt).all()
        return receipts

    def get_receipt(self, id: int) -> ReceiptRead:
        stmt = select(Receipt).where(Receipt.id == id)
        receipt = self.db.scalars(stmt).first()
        if not receipt:
            raise NotFoundException("영수증을 찾을 수 없습니다.")
        return receipt

    def create_receipt(self, receiptDTO: ReceiptCreate) -> ReceiptRead:
        if receiptDTO.category_id is not None and self.db.scalar(select(Category).where(Category.id == receiptDTO.category_id)) is None:
            raise NotFoundException("카테고리를 찾을 수 없습니다.")
        if self.db.scalar(select(Payer).where(Payer.id == receiptDTO.payer_id)) is None:
            raise NotFoundException("결제인을 찾을 수 없습니다.")

        receipt = Receipt(
            category_id=receiptDTO.category_id,
            payer_id=receiptDTO.payer_id,
            description=receiptDTO.description,
            income=receiptDTO.income,
            expense=receiptDTO.expense,
            discount=receiptDTO.discount,
            people_count=receiptDTO.people_count,
            receipt_url=receiptDTO.receipt_url,
            is_transferred=receiptDTO.is_transferred,
            transaction_at=receiptDTO.transaction_at,
            transferred_at=receiptDTO.transferred_at
        )
        self.db.add(receipt)
        self.db.commit()
        self.db.refresh(receipt)
        return self._to_receipt_read(receipt)
        
    def update_receipt(self, id: int, receiptDTO: ReceiptCreate) -> ReceiptRead:
        receipt = self.get_receipt(id)
        receipt.category_id = receiptDTO.category_id
        receipt.payer_id = receiptDTO.payer_id
        receipt.description = receiptDTO.description
        receipt.income = receiptDTO.income
        receipt.expense = receiptDTO.expense
        receipt.discount = receiptDTO.discount
        receipt.people_count = receiptDTO.people_count
        receipt.receipt_url = receiptDTO.receipt_url
        receipt.is_transferred = receiptDTO.is_transferred
        receipt.transaction_at = receiptDTO.transaction_at
        receipt.transferred_at = receiptDTO.transferred_at
        self.db.commit()
        self.db.refresh(receipt)
        return self._to_receipt_read(receipt)

    def delete_receipt(self, id: int):
        stmt = select(Receipt).where(Receipt.id == id)
        receipt = self.db.scalars(stmt).first()
        if not receipt:
            raise NotFoundException("영수증을 찾을 수 없습니다.")
        self.db.delete(receipt)
        self.db.commit()