export interface BudgetBulkUpdateItem {
  id: number;
  amount: number;
}

export interface BudgetBulkUpdate {
  items: BudgetBulkUpdateItem[];
}
