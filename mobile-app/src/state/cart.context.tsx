import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { LocalCartState, LocalCartItem, CartAction } from './cart.types';

interface CartContextType {
  state: LocalCartState;
  addToCart: (item: LocalCartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const initialState: LocalCartState = {
  items: [],
  totalAmount: 0,
  totalQuantity: 0,
};

function calculateTotals(items: LocalCartItem[]): { totalAmount: number; totalQuantity: number } {
  return items.reduce(
    (acc, item) => {
      const price = item.discountPrice ? parseFloat(item.discountPrice) : parseFloat(item.price);
      return {
        totalAmount: acc.totalAmount + price * item.quantity,
        totalQuantity: acc.totalQuantity + item.quantity,
      };
    },
    { totalAmount: 0, totalQuantity: 0 }
  );
}

function cartReducer(state: LocalCartState, action: CartAction): LocalCartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        (item) => item.id === action.payload.id
      );

      let newItems: LocalCartItem[];
      if (existingItemIndex > -1) {
        // Item exists, increment quantity
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        // New item, add to cart
        newItems = [...state.items, action.payload];
      }

      const totals = calculateTotals(newItems);
      return {
        items: newItems,
        ...totals,
      };
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter((item) => item.id !== action.payload);
      const totals = calculateTotals(newItems);
      return {
        items: newItems,
        ...totals,
      };
    }

    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        // Remove item if quantity becomes 0
        const newItems = state.items.filter((item) => item.id !== action.payload.itemId);
        const totals = calculateTotals(newItems);
        return {
          items: newItems,
          ...totals,
        };
      }

      const newItems = state.items.map((item) =>
        item.id === action.payload.itemId
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      const totals = calculateTotals(newItems);
      return {
        items: newItems,
        ...totals,
      };
    }

    case 'CLEAR_CART': {
      return initialState;
    }

    default:
      return state;
  }
}

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addToCart = (item: LocalCartItem) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeFromCart = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const value: CartContextType = {
    state,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
