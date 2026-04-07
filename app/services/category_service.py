from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.schema import Category
from app.models.category import CategoryRead, CategoryTreeRead
from app.core.exception import NotFoundException, ConflictException


class CategoryService:
    def __init__(self, session: Session):
        self.db = session
    
    def _to_category_read(self, category: Category) -> CategoryRead:
        return CategoryRead(
            id=category.id,
            name=category.name,
            parent_id=category.parent.id if category.parent else None,
            level=category.level
        )

    def _build_tree(self, category: Category) -> CategoryTreeRead:
        return CategoryTreeRead(
            id=category.id,
            name=category.name,
            parent_id=category.parent_id,
            children=[self._build_tree(child) for child in category.children]
        )

    def get_category_tree(self) -> list[CategoryTreeRead]:
        stmt = select(Category).where(Category.parent_id == None)
        categories = self.db.scalars(stmt).all()
        return [self._build_tree(category) for category in categories] #naive recursive query, not efficient

    def get_category(self, id: int) -> CategoryRead:
        stmt = select(Category).where(Category.id == id)
        category = self.db.scalar(stmt)
        if category is None:
            raise NotFoundException("분류명을 찾을 수 없습니다.")
        return self._to_category_read(category)
    
    def create_category(self, name: str, parent_id: int | None) -> CategoryRead:
        stmt = select(Category).where(Category.name == name)
        if self.db.scalar(stmt) is not None:
            raise ConflictException("이미 존재하는 분류명입니다.")
        
        if parent_id is None:
            category = Category(name=name, level=1)
        else:
            stmt = select(Category).where(Category.id == parent_id)
            parent_category = self.db.scalar(stmt)
            if parent_category is None:
                raise NotFoundException("부모 분류명을 찾을 수 없습니다.")
            category = Category(name=name, parent_id=parent_id, level=parent_category.level + 1)
            if category.level > 3:
                raise ConflictException("분류명의 깊이가 너무 깊습니다.")

        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return self._to_category_read(category)

    def _get_sub_categories_r(self, id: int, sub_categories: list[Category]) -> list[Category]:
        stmt = select(Category).where(Category.parent_id == id)
        categories = self.db.scalars(stmt).all()
        for category in categories:
            sub_categories.append(category)
            self._get_sub_categories_r(category.id, sub_categories)
        return sub_categories

    def _get_sub_categories(self, id: int) -> list[Category]:
        sub_categories = [self.db.scalar(select(Category).where(Category.id == id))]
        self._get_sub_categories_r(id, sub_categories)
        return sub_categories
    
    def _re_cal_level(self, id: int):
        stmt = select(Category).where(Category.id == id)
        category = self.db.scalar(stmt)
        category.level = 1 if category.parent is None else category.parent.level + 1
        for child in category.children:
            self._re_cal_level(child.id)

    # this function is damn inefficient, need to refactor
    def update_category(self, id: int, name: str, parent_id: int | None) -> CategoryRead:
        stmt = select(Category).where(Category.id == id)
        category = self.db.scalar(stmt)
        if category is None:
            raise NotFoundException("분류명을 찾을 수 없습니다.")
        
        if self.db.scalar(select(Category).where(Category.name == name, Category.id != id)) is not None:
            raise ConflictException("이미 존재하는 분류명입니다.")

        if parent_id is None:
            category.level = 1
        else:
            stmt = select(Category).where(Category.id == parent_id)
            parent_category = self.db.scalar(stmt)
            if parent_category is None:
                raise NotFoundException("부모 분류명을 찾을 수 없습니다.")
            if parent_category.level + 1 > 3:
                raise ConflictException("분류명의 깊이가 너무 깊습니다.")
            sub_categories = self._get_sub_categories(id)
            for sub_category in sub_categories:
                if sub_category.id == parent_id:
                    raise ConflictException("순환 분류가 감지되었습니다.")
                if sub_category.level - category.level + parent_category.level + 1 > 3:
                    raise ConflictException("분류명의 깊이가 너무 깊습니다.")
            category.level = parent_category.level + 1
            
        category.name = name
        category.parent_id = parent_id
        self._re_cal_level(id)
        self.db.commit()
        self.db.refresh(category)
        return self._to_category_read(category)

    def delete_category(self, id: int):
        stmt = select(Category).where(Category.id == id)
        category = self.db.scalar(stmt)
        if category is None:
            raise NotFoundException("분류명을 찾을 수 없습니다.")
        if category.children != []:
            raise ConflictException("하위 분류가 존재하여 삭제할 수 없습니다. 먼저 하위 분류를 삭제해주세요.")
        self.db.delete(category)
        self.db.commit()