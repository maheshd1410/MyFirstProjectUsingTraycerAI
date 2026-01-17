import { Request, Response } from 'express';
import { addressService } from '../services/address.service';
import { CreateAddressDTO, UpdateAddressDTO, AddressResponse } from '../types';

/**
 * Get all user addresses
 * GET /api/addresses
 */
export const getAddresses = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const addresses: AddressResponse[] = await addressService.getAddresses(userId);

    return res.status(200).json(addresses);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch addresses';
    return res.status(500).json({ error: message });
  }
};

/**
 * Get single address by ID
 * GET /api/addresses/:id
 */
export const getAddressById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const addressId = req.params.id;

    const address: AddressResponse = await addressService.getAddressById(userId, addressId);

    return res.status(200).json(address);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch address';
    const statusCode = message === 'Unauthorized' ? 403 : message === 'Address not found' ? 404 : 500;
    return res.status(statusCode).json({ error: message });
  }
};

/**
 * Create new address
 * POST /api/addresses
 */
export const createAddress = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const { fullName, phoneNumber, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;

    // Validate required fields
    if (!fullName || !phoneNumber || !addressLine1 || !city || !state || !postalCode || !country) {
      return res.status(400).json({
        error: 'Missing required fields: fullName, phoneNumber, addressLine1, city, state, postalCode, country',
      });
    }

    const data: CreateAddressDTO = {
      fullName,
      phoneNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault,
    };

    const address: AddressResponse = await addressService.createAddress(userId, data);

    return res.status(201).json(address);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create address';
    return res.status(400).json({ error: message });
  }
};

/**
 * Update address
 * PUT /api/addresses/:id
 */
export const updateAddress = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const addressId = req.params.id;
    const { fullName, phoneNumber, addressLine1, addressLine2, city, state, postalCode, country } = req.body;

    const data: UpdateAddressDTO = {
      fullName,
      phoneNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
    };

    const address: AddressResponse = await addressService.updateAddress(userId, addressId, data);

    return res.status(200).json(address);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update address';
    let statusCode = 400;
    if (message === 'Unauthorized') {
      statusCode = 403;
    } else if (message === 'Address not found') {
      statusCode = 404;
    }
    return res.status(statusCode).json({ error: message });
  }
};

/**
 * Delete address
 * DELETE /api/addresses/:id
 */
export const deleteAddress = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const addressId = req.params.id;

    await addressService.deleteAddress(userId, addressId);

    return res.status(200).json({ message: 'Address deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete address';
    let statusCode = 400;
    if (message === 'Unauthorized') {
      statusCode = 403;
    } else if (message === 'Address not found') {
      statusCode = 404;
    }
    return res.status(statusCode).json({ error: message });
  }
};

/**
 * Set address as default
 * PUT /api/addresses/:id/default
 */
export const setDefaultAddress = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const addressId = req.params.id;

    const address: AddressResponse = await addressService.setDefaultAddress(userId, addressId);

    return res.status(200).json(address);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to set default address';
    let statusCode = 400;
    if (message === 'Unauthorized') {
      statusCode = 403;
    } else if (message === 'Address not found') {
      statusCode = 404;
    }
    return res.status(statusCode).json({ error: message });
  }
};
