from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.db.schema import Category, Year
from app.models.category import CategoryRead, CategoryTreeRead, CategoryCreate, CategoryUpdate, CategoryOrderUpdate, BudgetBulkUpdate
from app.core.exception import NotFoundException, ConflictException


class CategoryService:
    def __init__(self, db: Session):
        self.db = db

    def _build_tree(self, category: Category) -> CategoryTreeRead:
        return CategoryTreeRead(
            id=category.id,
            name=category.name,
            level=category.level,
            sibling_order=category.sibling_order,
            amount=category.amount,
            parent_id=category.parent_id,
            year_id=category.year_id,
            children = [self._build_tree(child) for child in self.db.scalars(select(Category).where(Category.parent_id == category.id).order_by(Category.sibling_order.asc())).all()]
        )

    def get_category_tree(self, year_id: int) -> list[CategoryTreeRead]:
        stmt = select(Category).where(Category.parent_id == None, Category.year_id == year_id).order_by(Category.sibling_order.asc())
        categories = self.db.scalars(stmt).all()
        return [self._build_tree(category) for category in categories] #naive recursive query, not efficient

    def get_category(self, id: int) -> CategoryRead:
        category = self.db.scalar(select(Category).where(Category.id == id))
        if category is None:
            raise NotFoundException("분류명을 찾을 수 없습니다.")
        return category
    
    def create_category(self, request: CategoryCreate) -> CategoryRead:
        category = Category(
            name=request.name,
            amount=request.amount,
            parent_id=request.parent_id,
            year_id=request.year_id
        )

        if self.db.scalar(select(Year).where(Year.id == request.year_id)) is None:
            raise NotFoundException("연도를 찾을 수 없습니다.")
        
        if request.parent_id is None:
            category.level = 1
        else:
            parent_category = self.db.scalar(select(Category).where(Category.id == request.parent_id))
            if parent_category is None:
                raise NotFoundException("부모 분류명을 찾을 수 없습니다.")
            if parent_category.year_id != request.year_id:
                raise ConflictException("부모 분류명과 같은 연도여야 합니다.")
            category.level = parent_category.level + 1
            if category.level > 3:
                raise ConflictException("분류명의 깊이가 너무 깊습니다.")
        category.sibling_order = self.db.scalar(
            select(func.coalesce(func.max(Category.sibling_order), -1))
            .where(Category.parent_id == request.parent_id)
        ) + 1

        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    def _get_sub_categories_r(self, category: Category, sub_categories: list[Category]) -> list[Category]:
        for child in category.children:
            sub_categories.append(child)
            self._get_sub_categories_r(child, sub_categories)
        return sub_categories

    def _get_sub_categories(self, id: int) -> list[Category]:
        category = self.db.scalar(select(Category).where(Category.id == id))
        sub_categories = [category]
        self._get_sub_categories_r(category, sub_categories)
        return sub_categories
    
    def _re_cal_level(self, id: int):
        stmt = select(Category).where(Category.id == id)
        category = self.db.scalar(stmt)
        category.level = 1 if category.parent is None else category.parent.level + 1
        for child in category.children:
            self._re_cal_level(child.id)

    # this function is damn inefficient, need to refactor
    def update_category(self, id: int, request: CategoryUpdate) -> CategoryRead:
        category = self.db.scalar(select(Category).where(Category.id == id))
        if category is None:
            raise NotFoundException("분류명을 찾을 수 없습니다.")

        category.name = request.name
        category.amount = request.amount
        category.sibling_order = request.sibling_order

        if request.parent_id is None:
            category.level = 1
        else:
            parent_category = self.db.scalar(select(Category).where(Category.id == request.parent_id))
            if parent_category is None:
                raise NotFoundException("부모 분류명을 찾을 수 없습니다.")
            if parent_category.year_id != category.year_id:
                raise ConflictException("부모 분류명과 같은 연도여야 합니다.")
            if parent_category.level + 1 > 3:
                raise ConflictException("분류명의 깊이가 너무 깊습니다.")
            sub_categories = self._get_sub_categories(id)
            for sub_category in sub_categories:
                if sub_category.id == request.parent_id:
                    raise ConflictException("순환 분류가 감지되었습니다.")
                if sub_category.level - category.level + parent_category.level + 1 > 3:
                    raise ConflictException("말단 분류명의 깊이가 너무 깊습니다.")
            category.level = parent_category.level + 1
            
        category.parent_id = request.parent_id
        self._re_cal_level(id)
        self.db.commit()
        self.db.refresh(category)
        return category

    def update_category_reorder(self, id: int, request: CategoryOrderUpdate):
        category = self.db.scalar(select(Category).where(Category.id == id))
        if category is None:
            raise NotFoundException("분류명을 찾을 수 없습니다.")

        sibling_categories = self.db.scalars(
            select(Category)
            .where(Category.parent_id == category.parent_id)
            .order_by(Category.sibling_order.asc())
        ).all()
        
        if request.sibling_order < 0 or request.sibling_order >= len(sibling_categories):
            raise ConflictException("잘못된 순서입니다.")

        cur_ord = category.sibling_order
        new_ord = request.sibling_order
        
        if cur_ord < new_ord:
            for i in range(cur_ord+1, new_ord+1):
                sibling_categories[i].sibling_order -= 1
        elif cur_ord > new_ord:
            for i in range(new_ord, cur_ord):
                sibling_categories[i].sibling_order += 1
        
        category.sibling_order = request.sibling_order
        self.db.commit()
        self.db.refresh(category)
        return category
        
    def update_category_budgets(self, request: BudgetBulkUpdate):
        for item in request.items:
            category = self.db.scalar(select(Category).where(Category.id == item.id))
            if category is None:
                raise NotFoundException("분류명을 찾을 수 없습니다.")
            category.amount = item.amount
        self.db.commit()
        return category
        

    def delete_category(self, id: int):
        category = self.db.scalar(select(Category).where(Category.id == id))
        if category is None:
            raise NotFoundException("분류명을 찾을 수 없습니다.")
        self.db.delete(category)
        self.db.commit()