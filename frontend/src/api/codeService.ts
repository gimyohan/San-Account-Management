import apiClient from './client';
import type { SuccessResponse } from './client';
import type { CodeRead } from '../types/auth';

export const codeService = {
  getAll: () => apiClient.get<never, SuccessResponse<CodeRead[]>>('/auth/codes'),
  create: () => apiClient.post<never, SuccessResponse<CodeRead>>('/auth/codes'),
  updateMemo: (id: number, memo: string | null) => apiClient.patch<never, SuccessResponse<CodeRead>>(`/auth/codes/${id}`, { memo }),
  delete: (id: number) => apiClient.delete(`/auth/codes/${id}`),
};
