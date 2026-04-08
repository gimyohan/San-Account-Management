import apiClient from './client';
import type { SuccessResponse } from './client';
import type { Budget, BudgetCreate } from '../types/budget';

export const budgetService = {
  getAll: (fiscal_term_id: number) =>
    apiClient.get<never, SuccessResponse<Budget[]>>(`/budgets/`, { params: { fiscal_term_id } }),
  create: (data: BudgetCreate) =>
    apiClient.post<never, SuccessResponse<Budget>>('/budgets/', data),
  update: (id: number, data: BudgetCreate) =>
    apiClient.put<never, SuccessResponse<Budget>>(`/budgets/${id}`, data),
  delete: (id: number) => apiClient.delete(`/budgets/${id}`),
};
