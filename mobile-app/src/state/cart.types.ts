export interface LocalCartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: string;
  discountPrice?: string;
  quantity: number;
  variantId?: string;
  variantName?: string;
  variantAttributes?: Record<string, string>;
}

export interface LocalCartState {
  items: LocalCartItem[];
  totalAmount: number;
  totalQuantity: number;
}

export type CartAction =
  | { type: 'ADD_ITEM'; payload: LocalCartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { itemId: string; quantity: number } }
  | { type: 'CLEAR_CART' };
