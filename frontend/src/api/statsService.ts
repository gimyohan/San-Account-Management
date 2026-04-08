import apiClient from './client';
import type { SuccessResponse } from './client';
import type { BalanceResponse } from '../types/stats';

export const statsService = {
  getBalance: (params?: { start_date?: string; end_date?: string }) => 
    apiClient.get<never, BalanceResponse>('/stats/balance', { params })
};
