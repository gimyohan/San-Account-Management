import apiClient from './client';
import type { SuccessResponse } from './client';
import type { FiscalTerm, FiscalTermCreate } from '../types/budget';

export const fiscalTermService = {
  getAll: () => apiClient.get<never, SuccessResponse<FiscalTerm[]>>('/fiscal-term/'),
  create: (data: FiscalTermCreate) => apiClient.post<never, SuccessResponse<FiscalTerm>>('/fiscal-term/', data),
  update: (id: number, data: FiscalTermCreate) => apiClient.patch<never, SuccessResponse<FiscalTerm>>(`/fiscal-term/${id}`, data),
  delete: (id: number) => apiClient.delete(`/fiscal-term/${id}`),
};

