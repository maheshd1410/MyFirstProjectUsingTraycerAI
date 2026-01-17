import { api } from './api';
import {
  AdminAnalytics,
  AdminOrderFilters,
  AdminUserFilters,
  UserManagement,
  UserManagementDetail,
} from '../types';
import { Order } from '../types';

export const adminService = {
  getAllOrders: async (filters: AdminOrderFilters) => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.search) params.append('search', filters.search);

    const response = await api.get(`/admin/orders?${params.toString()}`);
    return response.data;
  },

  getAllUsers: async (filters: AdminUserFilters) => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters.role) params.append('role', filters.role);
    if (typeof filters.isActive === 'boolean') params.append('isActive', filters.isActive.toString());
    if (filters.search) params.append('search', filters.search);

    const response = await api.get(`/admin/users?${params.toString()}`);
    return response.data;
  },

  getUserById: async (userId: string): Promise<UserManagementDetail> => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  updateUserStatus: async (userId: string, isActive: boolean): Promise<UserManagement> => {
    const response = await api.put(`/admin/users/${userId}/status`, { isActive });
    return response.data;
  },

  getAnalytics: async (): Promise<AdminAnalytics> => {
    const response = await api.get('/admin/analytics');
    return response.data;
  },
};
