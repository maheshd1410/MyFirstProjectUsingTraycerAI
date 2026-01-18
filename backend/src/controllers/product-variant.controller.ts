import { Request, Response } from 'express';
import { productVariantService } from '../services/product-variant.service';
import { CreateProductVariantDTO, UpdateProductVariantDTO } from '../types';

export const createVariant = async (req: Request, res: Response) => {
  try {
    const data: CreateProductVariantDTO = req.body;
    const variant = await productVariantService.createVariant(data);
    res.status(201).json(variant);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create variant' });
  }
};

export const updateVariant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: UpdateProductVariantDTO = req.body;
    const variant = await productVariantService.updateVariant(id, data);
    res.json(variant);
  } catch (error: any) {
    if (error.message === 'Variant not found') {
      res.status(404).json({ error: 'Variant not found' });
    } else {
      res.status(400).json({ error: error.message || 'Failed to update variant' });
    }
  }
};

export const deleteVariant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await productVariantService.deleteVariant(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'Variant not found') {
      res.status(404).json({ error: 'Variant not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete variant' });
    }
  }
};

export const getVariantsByProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const variants = await productVariantService.getVariantsByProduct(productId);
    res.json(variants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch variants' });
  }
};

export const getVariantById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const variant = await productVariantService.getVariantById(id);
    res.json(variant);
  } catch (error: any) {
    if (error.message === 'Variant not found') {
      res.status(404).json({ error: 'Variant not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch variant' });
    }
  }
};

export const checkLowStock = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const variants = await productVariantService.checkLowStock(productId);
    res.json(variants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check low stock' });
  }
};
