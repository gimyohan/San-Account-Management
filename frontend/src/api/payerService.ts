import apiClient from './client';
import type { SuccessResponse } from './client';
import type { PayerRead, PayerCreate } from '../types/payer';

export const payerService = {
  getAll: () => apiClient.get<never, SuccessResponse<PayerRead[]>>('/payers/'),
  create: (data: PayerCreate) => apiClient.post<never, SuccessResponse<PayerRead>>('/payers/', data),
  update: (id: number, data: PayerCreate) => apiClient.patch<never, SuccessResponse<PayerRead>>(`/payers/${id}`, data),
  delete: (id: number) => apiClient.delete(`/payers/${id}`),
};
