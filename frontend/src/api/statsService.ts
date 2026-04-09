import apiClient from './client';
import type { SuccessResponse } from './client';
import type { BalanceStats } from '../types/stats';

export const statsService = {
  /**
   * Get financial balance summary.
   * Trailing slash removed to match backend.
   */
  getBalance: (params: { 
    quarter_id?: number; 
    year_id?: number; 
    start_date?: string; 
    end_date?: string; 
  }) => apiClient.get<never, SuccessResponse<BalanceStats>>('/stats/balance', { params }),
};
