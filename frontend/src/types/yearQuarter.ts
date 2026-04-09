export interface Year {
  id: number;
  year: number;
  name: string | null;
}

export interface YearCreate {
  year: number;
  name?: string;
}

export interface Quarter {
  id: number;
  order: number;
  name: string;
  year_id: number;
}

export interface QuarterCreate {
  year_id: number;
  order: number;
  name: string;
}

export interface QuarterUpdate {
  order?: number;
  name?: string;
}
