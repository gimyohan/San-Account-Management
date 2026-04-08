import apiClient from './client';
import type { SuccessResponse } from './client';
import type { ReceiptRead, ReceiptCreate } from '../types/receipt';

export const receiptService = {
  getAll: (params?: { 
    start_date?: string; 
    end_date?: string; 
    category_id?: number; 
    payer_id?: number; 
    is_transferred?: boolean 
  }) => apiClient.get<never, SuccessResponse<ReceiptRead[]>>('/receipts/', { params }),
  getById: (id: number) => apiClient.get<never, SuccessResponse<ReceiptRead>>(`/receipts/${id}`),
  create: (data: ReceiptCreate) => apiClient.post<never, SuccessResponse<ReceiptRead>>('/receipts/', data),
  update: (id: number, data: ReceiptCreate) => apiClient.patch<never, SuccessResponse<ReceiptRead>>(`/receipts/${id}`, data),
  delete: (id: number) => apiClient.delete(`/receipts/${id}`),
};
