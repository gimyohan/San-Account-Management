import apiClient from './client';
import type { SuccessResponse } from './client';
import type { Receipt, ReceiptCreate, ReceiptUpdate } from '../types/receipt';

export const receiptService = {
  // 슬래시 제거
  getByQuarter: (quarter_id: number, params?: any) => 
    apiClient.get<never, SuccessResponse<Receipt[]>>('/receipts', { params: { quarter_id, ...params } }),
  create: (data: ReceiptCreate) => apiClient.post<never, SuccessResponse<Receipt>>('/receipts', data),
  update: (id: number, data: ReceiptUpdate) => apiClient.patch<never, SuccessResponse<Receipt>>(`/receipts/${id}`, data),
  delete: (id: number) => apiClient.delete(`/receipts/${id}`),
};
