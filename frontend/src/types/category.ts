export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  level: number;
}

export interface CategoryTree {
  id: number;
  name: string;
  parent_id: number | null;
  children: CategoryTree[];
}

export interface CategoryCreate {
  name: string;
  parent_id: number | null;
}
