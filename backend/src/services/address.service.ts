import { prisma } from '../config/database';
import { CreateAddressDTO, UpdateAddressDTO, AddressResponse } from '../types';

export class AddressService {
  /**
   * Get all addresses for a user, ordered by isDefault DESC
   */
  async getAddresses(userId: string): Promise<AddressResponse[]> {
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });

    return addresses.map((addr) => ({
      ...addr,
      addressLine2: addr.addressLine2 || undefined,
    }));
  }

  /**
   * Get single address by ID with ownership verification
   */
  async getAddressById(userId: string, addressId: string): Promise<AddressResponse> {
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new Error('Address not found');
    }

    if (address.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return {
      ...address,
      addressLine2: address.addressLine2 || undefined,
    };
  }

  /**
   * Create new address with automatic default handling
   */
  async createAddress(userId: string, data: CreateAddressDTO): Promise<AddressResponse> {
    // Get count of existing addresses for this user
    const addressCount = await prisma.address.count({
      where: { userId },
    });

    // Determine if this should be default
    const isDefault = addressCount === 0 || data.isDefault === true;

    // If this address is being set as default, unset all other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    // Create new address
    const address = await prisma.address.create({
      data: {
        userId,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        isDefault,
      },
    });

    return {
      ...address,
      addressLine2: address.addressLine2 || undefined,
    };
  }

  /**
   * Update address with ownership verification
   */
  async updateAddress(
    userId: string,
    addressId: string,
    data: UpdateAddressDTO
  ): Promise<AddressResponse> {
    // Verify ownership
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new Error('Address not found');
    }

    if (address.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Update address
    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: {
        fullName: data.fullName ?? address.fullName,
        phoneNumber: data.phoneNumber ?? address.phoneNumber,
        addressLine1: data.addressLine1 ?? address.addressLine1,
        addressLine2: data.addressLine2 ?? address.addressLine2,
        city: data.city ?? address.city,
        state: data.state ?? address.state,
        postalCode: data.postalCode ?? address.postalCode,
        country: data.country ?? address.country,
      },
    });

    return {
      ...updatedAddress,
      addressLine2: updatedAddress.addressLine2 || undefined,
    };
  }

  /**
   * Delete address with ownership verification
   * Prevent deletion if it's the only address
   */
  async deleteAddress(userId: string, addressId: string): Promise<void> {
    // Verify ownership
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new Error('Address not found');
    }

    if (address.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Check if this is the only address
    const addressCount = await prisma.address.count({
      where: { userId },
    });

    if (addressCount === 1) {
      throw new Error('Cannot delete the only address. Please add another address first.');
    }

    // If this is the default address, set another as default
    if (address.isDefault) {
      const nextAddress = await prisma.address.findFirst({
        where: {
          userId,
          id: { not: addressId },
        },
      });

      if (nextAddress) {
        await prisma.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    // Delete the address
    await prisma.address.delete({
      where: { id: addressId },
    });
  }

  /**
   * Set address as default and unset all other defaults
   * Uses Prisma transaction for consistency
   */
  async setDefaultAddress(userId: string, addressId: string): Promise<AddressResponse> {
    // Verify ownership
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new Error('Address not found');
    }

    if (address.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Unset all defaults for this user
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });

      // Set the selected address as default
      const updatedAddress = await tx.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      });

      return updatedAddress;
    });

    return {
      ...result,
      addressLine2: result.addressLine2 || undefined,
    };
  }
}

export const addressService = new AddressService();
