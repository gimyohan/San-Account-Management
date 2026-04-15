import apiClient from './client';
import type { SuccessResponse } from './client';
import type { Receipt, ReceiptCreate, ReceiptUpdate } from '../types/receipt';

export const receiptService = {
  list: (params?: { 
    year_id?: number; 
    quarter_id?: number; 
    start_date?: string; 
    end_date?: string; 
    category_id?: number; 
    payer_id?: number; 
    is_transferred?: boolean; 
  }) => apiClient.get<never, SuccessResponse<Receipt[]>>('/receipts', { params }),
  create: (data: ReceiptCreate) => apiClient.post<never, SuccessResponse<Receipt>>('/receipts', data),
  update: (id: number, data: ReceiptUpdate) => apiClient.patch<never, SuccessResponse<Receipt>>(`/receipts/${id}`, data),
  delete: (id: number) => apiClient.delete(`/receipts/${id}`),
};
