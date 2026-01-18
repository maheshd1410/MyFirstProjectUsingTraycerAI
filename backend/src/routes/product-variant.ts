import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as variantController from '../controllers/product-variant.controller';

const router = Router();

// Admin routes
router.post('/', authenticate, authorize(['ADMIN']), variantController.createVariant);
router.put('/:id', authenticate, authorize(['ADMIN']), variantController.updateVariant);
router.delete('/:id', authenticate, authorize(['ADMIN']), variantController.deleteVariant);

// Public routes
router.get('/product/:productId', variantController.getVariantsByProduct);
router.get('/:id', variantController.getVariantById);

// Admin analytics
router.get('/product/:productId/low-stock', authenticate, authorize(['ADMIN']), variantController.checkLowStock);

export default router;
