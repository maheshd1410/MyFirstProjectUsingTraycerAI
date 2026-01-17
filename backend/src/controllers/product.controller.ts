import { Request, Response } from 'express';
import { productService } from '../services/product.service';
import { CreateProductDTO, UpdateProductDTO, ProductFilterDTO } from '../types';
import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';
import { searchService } from '../services/search.service';
import { productViewService } from '../services/product-view.service';
import { randomUUID } from 'crypto';

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const filters: ProductFilterDTO = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 10,
      search: req.query.search as string,
      categoryId: req.query.categoryId as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : 0,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      sortBy: (req.query.sortBy as any) || 'newest',
      inStock: req.query.inStock === 'true',
      minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
      userId: (req as any).user?.userId,
    };

    const result = await productService.getAllProducts(filters);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    
    // Track product view asynchronously (fire and forget)
    const sessionId = (req as any).session?.id || randomUUID();
    productViewService.trackView({
      productId: id,
      userId: (req as any).user?.id,
      sessionId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    }).catch(() => {}); // Silently fail - views are non-critical
    
    res.json(product);
  } catch (error: any) {
    if (error.message === 'Product not found') {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  }
};

export const getFeaturedProducts = async (req: Request, res: Response) => {
  try {
    const products = await productService.getFeaturedProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
};

export const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const products = await productService.getProductsByCategory(categoryId);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products by category' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const data: CreateProductDTO = req.body;
    const product = await productService.createProduct(data);
    res.status(201).json(product);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create product' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: UpdateProductDTO = req.body;

    const product = await productService.updateProduct(id, data);
    res.json(product);
  } catch (error: any) {
    if (error.message === 'Product not found') {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.status(400).json({ error: error.message || 'Failed to update product' });
    }
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await productService.deleteProduct(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'Product not found') {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete product' });
    }
  }
};

export const getSearchSuggestions = async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    if (limit < 1 || limit > 20) {
      return res.status(400).json({ error: 'Limit must be between 1 and 20' });
    }

    const suggestions = await searchService.generateSearchSuggestions(q.trim(), limit);
    res.json({ suggestions });
  } catch (error: any) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ error: 'Failed to fetch search suggestions' });
  }
};

export const uploadProductImages = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const uploadPromises = files.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'ladoo-business/products',
            resource_type: 'image',
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result!.secure_url);
            }
          }
        );

        // Convert buffer to stream and pipe to cloudinary
        const readableStream = Readable.from(file.buffer);
        readableStream.pipe(uploadStream);
      });
    });

    const imageUrls = await Promise.all(uploadPromises);
    res.json({ imageUrls });
  } catch (error: any) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
};
