from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.schema import Year
from app.models import year as model
from app.core.exception import NotFoundException, ConflictException

class YearService:
    def __init__(self, session: Session):
        self.db = session

    def get_years(self) -> list[model.YearRead]:
        stmt = select(Year).order_by(Year.year.desc())
        return [model.YearRead.model_validate(year) for year in self.db.scalars(stmt).all()]

    def create_year(self, request: model.YearCreate) -> model.YearRead:
        if self.db.scalar(select(Year).where(Year.year == request.year)):
            raise ConflictException("이미 존재하는 년도입니다.")
        year = Year(
            year=request.year,
            name=request.name
        )
        self.db.add(year)
        self.db.commit()
        self.db.refresh(year)
        return model.YearRead.model_validate(year)

    def update_year(self, year_id: int, request: model.YearCreate) -> model.YearRead:
        year = self.db.scalar(select(Year).where(Year.id == year_id))
        if not year:
            raise NotFoundException("년도를 찾을 수 없습니다.")
        if self.db.scalar(select(Year).where(Year.year == request.year, Year.id != year_id)):
            raise ConflictException("이미 존재하는 년도입니다.")
        year.year = request.year
        year.name = request.name
        self.db.commit()
        self.db.refresh(year)
        return model.YearRead.model_validate(year)

    def delete_year(self, year_id: int) -> None:
        year = self.db.scalar(select(Year).where(Year.id == year_id))
        if not year:
            raise NotFoundException("년도를 찾을 수 없습니다.")
        self.db.delete(year)
        self.db.commit()