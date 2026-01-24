import { PixelRatio } from 'react-native';

/**
 * Ensure minimum touch target size (default 44x44 as per accessibility guidelines)
 */
export const ensureTouchTarget = (size: number = 44) => ({
  minWidth: size,
  minHeight: size,
});

/**
 * Generate accessible label for buttons based on state
 */
export const getButtonAccessibilityLabel = (
  label: string,
  state?: 'loading' | 'disabled'
): string => {
  if (state === 'loading') return `${label}, loading`;
  if (state === 'disabled') return `${label}, disabled`;
  return label;
};

/**
 * Generate accessible label for form inputs
 */
export const getInputAccessibilityLabel = (
  label: string,
  required: boolean = false,
  error?: string
): string => {
  let accessibilityLabel = label;
  if (required) accessibilityLabel += ', required';
  if (error) accessibilityLabel += `, error: ${error}`;
  return accessibilityLabel;
};

/**
 * Generate accessible hint for actions
 */
export const getAccessibilityHint = (action: string): string => {
  return `Double tap to ${action}`;
};

/**
 * Check current text scaling factor
 */
export const getTextScalingFactor = (): number => {
  return PixelRatio.getFontScale();
};

/**
 * Check if text scaling is enabled
 */
export const isTextScalingEnabled = (): boolean => {
  return getTextScalingFactor() > 1;
};

/**
 * Format price for screen readers
 */
export const formatPriceForScreenReader = (price: number): string => {
  const rupees = Math.floor(price);
  const paise = Math.round((price - rupees) * 100);
  
  if (paise === 0) {
    return `${rupees} rupees`;
  }
  return `${rupees} rupees and ${paise} paise`;
};

/**
 * Format quantity for screen readers
 */
export const formatQuantityForScreenReader = (
  quantity: number,
  unit?: string
): string => {
  const itemWord = quantity === 1 ? 'item' : 'items';
  return `${quantity} ${unit || itemWord}`;
};

/**
 * Format product info for screen reader
 */
export const formatProductForScreenReader = (product: {
  name: string;
  price: number;
  rating?: number;
  inStock?: boolean;
}): string => {
  let description = product.name;
  description += `, price ${formatPriceForScreenReader(product.price)}`;
  
  if (product.rating !== undefined) {
    description += `, rated ${product.rating.toFixed(1)} out of 5 stars`;
  }
  
  if (product.inStock === false) {
    description += ', out of stock';
  }
  
  return description;
};

/**
 * Create accessible label for cart item
 */
export const formatCartItemForScreenReader = (item: {
  productName: string;
  quantity: number;
  price: number;
}): string => {
  return `${item.productName}, quantity ${item.quantity}, subtotal ${formatPriceForScreenReader(
    item.price * item.quantity
  )}`;
};
