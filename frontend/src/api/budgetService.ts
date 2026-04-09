import apiClient from './client';
import type { SuccessResponse } from './client';
import type { BudgetBulkUpdate } from '../types/budget';

export const budgetService = {
  // 예산 일괄 업데이트는 /categories/budgets/bulk 엔드포인트를 PATCH로 호출
  updateBulk: (data: BudgetBulkUpdate) => 
    apiClient.patch<never, SuccessResponse<any>>('/categories/budgets/bulk', data),
};
