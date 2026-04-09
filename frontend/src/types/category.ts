export interface Category {
  id: number;
  name: string;
  amount: number;
  parent_id: number | null;
  level: number;
  sibling_order: number;
  year_id: number;
}

export interface CategoryTree {
  id: number;
  name: string;
  amount: number;
  parent_id: number | null;
  level: number;
  sibling_order: number;
  year_id: number;
  children: CategoryTree[];
}

export interface CategoryCreate {
  year_id: number;
  name: string;
  amount: number;
  sibling_order: number;
  parent_id: number | null;
}

export interface CategoryUpdate {
  name: string;
  amount: number;
  sibling_order: number;
  parent_id: number | null;
  year_id: number;
}
