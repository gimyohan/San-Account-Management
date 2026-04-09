import apiClient from './client';
import type { SuccessResponse } from './client';
import type { CategoryTree, CategoryCreate } from '../types/category';

export const categoryService = {
  // GET: year_id as query param (Required by backend)
  getByYear: (year_id: number) => 
    apiClient.get<never, SuccessResponse<CategoryTree[]>>(`/categories?year_id=${year_id}`),
  
  // POST & PATCH: All required fields should be in the BODY as per CategoryCreate model.
  create: (data: CategoryCreate) => 
    apiClient.post<never, SuccessResponse<any>>('/categories', data),
  
  update: (id: number, data: any) => 
    apiClient.patch<never, SuccessResponse<any>>(`/categories/${id}`, data),

  // New: Sibling Reorder
  reorder: (id: number, sibling_order: number) => 
    apiClient.patch<never, SuccessResponse<any>>(`/categories/${id}/reorder`, { sibling_order }),
  
  delete: (id: number) => 
    apiClient.delete(`/categories/${id}`),
};
