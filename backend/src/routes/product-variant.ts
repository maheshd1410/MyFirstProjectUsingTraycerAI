import { Router } from 'express';
import { authenticate, authorize, requireRole } from '../middleware/auth';
import * as variantController from '../controllers/product-variant.controller';

const router = Router();

// Admin routes
router.post('/', authenticate, requireRole('ADMIN'), variantController.createVariant);
router.put('/:id', authenticate, requireRole('ADMIN'), variantController.updateVariant);
router.delete('/:id', authenticate, requireRole('ADMIN'), variantController.deleteVariant);

// Public routes
router.get('/product/:productId', variantController.getVariantsByProduct);
router.get('/:id', variantController.getVariantById);

// Admin analytics
router.get('/product/:productId/low-stock', authenticate, requireRole('ADMIN'), variantController.checkLowStock);

export default router;
