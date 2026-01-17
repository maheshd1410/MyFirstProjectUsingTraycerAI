import { Request, Response } from 'express';
import { categoryService } from '../services/category.service';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../types';

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id);
    res.json(category);
  } catch (error: any) {
    if (error.message === 'Category not found') {
      res.status(404).json({ error: 'Category not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch category' });
    }
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const data: CreateCategoryDTO = req.body;

    // Validate required name field
    if (!data.name) {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }

    const category = await categoryService.createCategory(data);
    res.status(201).json(category);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create category' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: UpdateCategoryDTO = req.body;

    const category = await categoryService.updateCategory(id, data);
    res.json(category);
  } catch (error: any) {
    if (error.message === 'Category not found') {
      res.status(404).json({ error: 'Category not found' });
    } else {
      res.status(400).json({ error: error.message || 'Failed to update category' });
    }
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await categoryService.deleteCategory(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'Category not found') {
      res.status(404).json({ error: 'Category not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete category' });
    }
  }
};
