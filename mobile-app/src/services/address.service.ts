import api from './api';
import { Address, CreateAddressData, UpdateAddressData } from '../types';


export const addressService = {
  /**
   * Fetch all addresses for the authenticated user
   */
  async getAddresses(): Promise<Address[]> {
    const response = await api.get('/addresses');
    return response.data;
  },

  /**
   * Fetch a specific address by ID
   */
  async getAddressById(id: string): Promise<Address> {
    const response = await api.get(`/addresses/${id}`);
    return response.data;
  },

  /**
   * Create a new address
   */
  async createAddress(data: CreateAddressData): Promise<Address> {
    const response = await api.post('/addresses', data);
    return response.data;
  },

  /**
   * Update an existing address
   */
  async updateAddress(id: string, data: UpdateAddressData): Promise<Address> {
    const response = await api.put(`/addresses/${id}`, data);
    return response.data;
  },

  /**
   * Delete an address
   */
  async deleteAddress(id: string): Promise<void> {
    await api.delete(`/addresses/${id}`);
  },

  /**
   * Set an address as default
   */
  async setDefaultAddress(id: string): Promise<Address> {
    const response = await api.put(`/addresses/${id}/default`);
    return response.data;
  },
};
