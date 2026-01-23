import { Product } from '../../types';

export interface ProductCardProps {
  product: Product;
  onPress: (productId: string) => void;
  variant?: 'grid' | 'list';
  onWishlistToggle?: (productId: string, isInWishlist: boolean) => void;
  isInWishlist?: boolean;
}
