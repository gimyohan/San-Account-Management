import apiClient from './client';
import type { SuccessResponse } from './client';
import type { Category, CategoryTree, CategoryCreate } from '../types/category';

export const categoryService = {
  getTree: () => apiClient.get<never, SuccessResponse<CategoryTree[]>>('/categories/'),
  getById: (id: number) => apiClient.get<never, SuccessResponse<Category>>(`/categories/${id}`),
  create: (data: CategoryCreate) => apiClient.post<never, SuccessResponse<Category>>('/categories/', data),
  update: (id: number, data: CategoryCreate) => apiClient.patch<never, SuccessResponse<Category>>(`/categories/${id}`, data),
  delete: (id: number) => apiClient.delete(`/categories/${id}`),
};
