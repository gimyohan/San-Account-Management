export interface FiscalTerm {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
}

export interface FiscalTermCreate {
  name: string;
  start_date: string;
  end_date: string;
}

export interface Budget {
  id: number;
  category_id: number;
  fiscal_term_id: number;
  amount: number;
}

export interface BudgetCreate {
  category_id: number;
  fiscal_term_id: number;
  amount: number;
}

export interface BulkBudgetItem {
  category_id: number;
  amount: number;
}

export interface BulkBudgetCreate {
  fiscal_term_id: number;
  budgets: BulkBudgetItem[];
}
