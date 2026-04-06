from sqlalchemy import create_engine
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship

from app.core.config import config

from datetime import datetime, timezone
from typing import Optional
import logging

logging.info(config.db_url)
engine = create_engine(config.db_url, echo = True)

def get_db():
    with Session(engine) as session:
        yield session

class Base(DeclarativeBase):
    pass

class Receipt(Base):
    __tablename__ = "receipts"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    payer_id: Mapped[int] = mapped_column(ForeignKey("payers.id"), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    income: Mapped[int] = mapped_column(nullable=False, default=0)
    expense: Mapped[int] = mapped_column(nullable=False, default=0)
    discount: Mapped[int] = mapped_column(nullable=False, default=0)
    people_count: Mapped[Optional[int]] = mapped_column(nullable=True, default=1)
    receipt_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_transferred: Mapped[bool] = mapped_column(nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(nullable=False, default=lambda:datetime.now(timezone.utc))
    transaction_at: Mapped[datetime] = mapped_column(nullable=False)
    transferred_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)

    category: Mapped["Category"] = relationship(back_populates="receipts")
    payer: Mapped["Payer"] = relationship(back_populates="receipts")


class Payer(Base):
    __tablename__ = "payers"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(32), nullable=False)
    account: Mapped[str] = mapped_column(String(32), nullable=False, default="kakao-pay")

    receipts: Mapped[list["Receipt"]] = relationship(back_populates="payer")


class Category(Base):
    __tablename__ = "categories"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    parent_id: Mapped[Optional[int]] = mapped_column(ForeignKey("categories.id"), nullable=True)
    level: Mapped[int] = mapped_column(nullable=False, default=1)
    name: Mapped[str] = mapped_column(String(32), nullable=False, unique=True)

    parent: Mapped[Optional["Category"]] = relationship(back_populates="children", remote_side=[id])
    children: Mapped[list["Category"]] = relationship(back_populates="parent")
    receipts: Mapped[list["Receipt"]] = relationship(back_populates="category")
    budget: Mapped["Budget"] = relationship(back_populates="category")


class FiscalTerm(Base):
    __tablename__ = "fiscal_terms"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(32), nullable=False)
    start_date: Mapped[datetime] = mapped_column(nullable=False)
    end_date: Mapped[datetime] = mapped_column(nullable=False)

    budgets: Mapped[list["Budget"]] = relationship(back_populates="fiscal_term")
    

class Budget(Base):
    __tablename__ = "budgets"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), nullable=False)
    fiscal_term_id: Mapped[int] = mapped_column(ForeignKey("fiscal_terms.id"), nullable=False)
    amount: Mapped[int] = mapped_column(nullable=False)

    category: Mapped["Category"] = relationship(back_populates="budget")
    fiscal_term: Mapped["FiscalTerm"] = relationship(back_populates="budgets")


class Code(Base):
    __tablename__ = "codes"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(32), nullable=False)
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    memo: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    last_accessed_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    