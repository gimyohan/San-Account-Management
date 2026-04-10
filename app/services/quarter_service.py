from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.schema import Quarter, Year
from app.models import quarter as model
from app.core.exception import NotFoundException

class QuarterService:
    def __init__(self, session: Session):
        self.db = session

    def get_quarters(self, year_id: int) -> list[model.QuarterRead]:
        return [model.QuarterRead.model_validate(q) for q in self.db.scalars(select(Quarter).where(Quarter.year_id == year_id).order_by(Quarter.order)).all()]

    def get_quarter(self, quarter_id: int) -> model.QuarterRead:
        return model.QuarterRead.model_validate(self.db.scalar(select(Quarter).where(Quarter.id == quarter_id)))

    def create_quarter(self, request: model.QuarterCreate) -> model.QuarterRead:
        if self.db.scalar(select(Year).where(Year.id==request.year_id)) is None:
            raise NotFoundException("년도를 찾을 수 없습니다.")
        quarter = Quarter(
            order=request.order,
            name=request.name,
            year_id=request.year_id
        )
        self.db.add(quarter)
        self.db.commit()
        self.db.refresh(quarter)
        return quarter

    def update_quarter(self, quarter_id: int, request: model.QuarterUpdate) -> model.QuarterRead:
        quarter = self.db.scalar(select(Quarter).where(Quarter.id == quarter_id))
        if quarter is None:
            raise NotFoundException("분기를 찾을 수 없습니다.")
        quarter.order = request.order
        if request.name is not None:
            quarter.name = request.name
        self.db.commit()
        self.db.refresh(quarter)
        return quarter

    def delete_quarter(self, quarter_id: int) -> None:
        quarter = self.db.scalar(select(Quarter).where(Quarter.id == quarter_id))
        if quarter is None:
            raise NotFoundException("분기를 찾을 수 없습니다.")
        self.db.delete(quarter)
        self.db.commit()
        return None