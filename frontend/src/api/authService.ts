import apiClient from './client';
import type { SuccessResponse } from './client';

export interface AuthRole {
  role: string;
}

export const authService = {
  // OAuth2PasswordRequestForm은 form-data로 전송해야 함
  login: (type: string, code: string) => {
    const formData = new URLSearchParams();
    formData.append('username', type);
    formData.append('password', code);
    return apiClient.post<never, SuccessResponse<AuthRole>>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  },
  me: () => apiClient.get<never, SuccessResponse<AuthRole>>('/auth/me'),
  logout: () => apiClient.post<never, SuccessResponse<null>>('/auth/logout'),
};
