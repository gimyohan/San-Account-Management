import apiClient from './client';
import type { SuccessResponse } from './client';
import type { Quarter, QuarterCreate, QuarterUpdate } from '../types/yearQuarter';

export const quarterService = {
  // 슬래시 제거
  getByYear: (year_id: number) => apiClient.get<never, SuccessResponse<Quarter[]>>(`/quarters?year_id=${year_id}`),
  create: (data: QuarterCreate) => apiClient.post<never, SuccessResponse<Quarter>>('/quarters', data),
  update: (id: number, data: QuarterUpdate) => apiClient.patch<never, SuccessResponse<Quarter>>(`/quarters/${id}`, data),
  delete: (id: number) => apiClient.delete(`/quarters/${id}`),
};
