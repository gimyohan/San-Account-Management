import apiClient from './client';
import type { SuccessResponse } from './client';
import type { Year, YearCreate } from '../types/yearQuarter';

export const yearService = {
  // 슬래시 제거하여 백엔드("") 사양에 맞춤
  getAll: () => apiClient.get<never, SuccessResponse<Year[]>>('/years'),
  create: (data: YearCreate) => apiClient.post<never, SuccessResponse<Year>>('/years', data),
  update: (id: number, data: YearCreate) => apiClient.put<never, SuccessResponse<Year>>(`/years/${id}`, data),
  delete: (id: number) => apiClient.delete(`/years/${id}`),
};
