import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchWishlist,
  addToWishlistAsync,
  removeFromWishlistAsync,
  selectWishlistItems,
  selectWishlistLoading,
  selectWishlistError,
} from '../store/wishlist/wishlistSlice';

export const useWishlist = () => {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectWishlistItems);
  const loading = useAppSelector(selectWishlistLoading);
  const error = useAppSelector(selectWishlistError);

  const isInWishlist = (productId: string) => {
    return items.some((item) => item.productId === productId);
  };

  const toggleWishlist = async (productId: string) => {
    if (isInWishlist(productId)) {
      await dispatch(removeFromWishlistAsync(productId));
    } else {
      await dispatch(addToWishlistAsync(productId));
    }
  };

  return {
    items,
    loading,
    error,
    isInWishlist,
    toggleWishlist,
    fetchWishlist: () => dispatch(fetchWishlist()),
  };
};
