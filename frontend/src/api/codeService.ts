import apiClient from './client';
import type { SuccessResponse } from './client';
import type { CodeRead, CodeListRead, CodePrevMemoRead } from '../types/auth';

export const codeService = {
  // 1.3 액세스 코드 리스트 조회
  getAll: (offset: number = 0, limit: number = 5, sortKey: string = 'last_accessed_at') => 
    apiClient.get<never, SuccessResponse<CodeListRead>>('/auth/codes', {
      params: { offset, limit, sort_key: sortKey }
    }),

  // 1.4 액세스 코드 생성
  create: (params: { code?: string; memo?: string; length?: number }) => 
    apiClient.post<never, SuccessResponse<CodeRead>>('/auth/codes', null, {
      params: { 
        custom_code: params.code, 
        memo: params.memo, 
        length: params.length 
      }
    }),

  // 1.3 액세스 코드 메모 수정
  updateMemo: (id: number, memo: string) => 
    apiClient.patch<never, SuccessResponse<CodePrevMemoRead>>(`/auth/codes/${id}/memo`, { memo }),

  delete: (id: number) => apiClient.delete(`/auth/codes/${id}`),
};
