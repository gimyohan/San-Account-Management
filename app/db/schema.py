from sqlalchemy import create_engine
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship

from app.core.config import config

from datetime import datetime, timezone
from typing import Optional
import logging

logging.info(config.db_url)
engine = create_engine(config.db_url, echo = False)

def get_db():
    with Session(engine) as session:
        yield session

class Base(DeclarativeBase):
    pass

# Global Scope
class Code(Base):
    __tablename__ = "codes"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(32), unique=True)
    role: Mapped[str] = mapped_column(String(32))
    memo: Mapped[str] = mapped_column(String(255), default="")
    access_count: Mapped[int] = mapped_column(default=0)
    last_accessed_at: Mapped[Optional[datetime]] = mapped_column()

class Payer(Base):
    __tablename__ = "payers"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(32))
    account: Mapped[str] = mapped_column(String(32), default="kakao-pay")

    receipts: Mapped[list["Receipt"]] = relationship(back_populates="payer")

# Year Scope
class Year(Base):
    __tablename__ = "years"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    year: Mapped[int] = mapped_column(nullable=False, unique=True)
    name: Mapped[Optional[str]] = mapped_column(String(32))

    quarters: Mapped[list["Quarter"]] = relationship(back_populates="year", passive_deletes=True)
    categories: Mapped[list["Category"]] = relationship(back_populates="year", passive_deletes=True)

class Category(Base):
    __tablename__ = "categories"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(32))
    level: Mapped[int] = mapped_column(default=1)
    sibling_order: Mapped[int] = mapped_column(default=0)
    amount: Mapped[int] = mapped_column(default=0)
    parent_id: Mapped[Optional[int]] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"))
    year_id: Mapped[int] = mapped_column(ForeignKey("years.id", ondelete="CASCADE"))

    parent: Mapped[Optional["Category"]] = relationship(back_populates="children", remote_side=[id])
    children: Mapped[list["Category"]] = relationship(back_populates="parent", passive_deletes=True)
    year: Mapped["Year"] = relationship(back_populates="categories")
    receipts: Mapped[list["Receipt"]] = relationship(back_populates="category")


# Sub-Year Scope
class Quarter(Base):
    __tablename__ = "quarters"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order: Mapped[int] = mapped_column()
    name: Mapped[str] = mapped_column(String(32))
    year_id: Mapped[int] = mapped_column(ForeignKey("years.id", ondelete="CASCADE"))

    year: Mapped["Year"] = relationship(back_populates="quarters")
    receipts: Mapped[list["Receipt"]] = relationship(back_populates="quarter")

class Receipt(Base):
    __tablename__ = "receipts"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    description: Mapped[str] = mapped_column(String(255))
    income: Mapped[int] = mapped_column(default=0)
    expense: Mapped[int] = mapped_column(default=0)
    discount: Mapped[int] = mapped_column(default=0)
    people_count: Mapped[Optional[int]] = mapped_column(default=1)
    receipt_url: Mapped[Optional[str]] = mapped_column(String(255))
    is_transferred: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(default=lambda:datetime.now(timezone.utc))
    transaction_at: Mapped[datetime] = mapped_column()
    transferred_at: Mapped[Optional[datetime]] = mapped_column()
    category_id: Mapped[Optional[int]] = mapped_column(ForeignKey("categories.id"))
    payer_id: Mapped[Optional[int]] = mapped_column(ForeignKey("payers.id"))
    quarter_id: Mapped[int] = mapped_column(ForeignKey("quarters.id"))

    category: Mapped["Category"] = relationship(back_populates="receipts")
    payer: Mapped["Payer"] = relationship(back_populates="receipts")
    quarter: Mapped["Quarter"] = relationship(back_populates="receipts")
