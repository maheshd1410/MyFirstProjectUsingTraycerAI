import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchWishlist,
  removeFromWishlistAsync,
  clearWishlistAsync,
  selectWishlistItems,
  selectWishlistLoading,
  selectWishlistError,
  selectWishlistItemCount,
} from '../../store/wishlist/wishlistSlice';
import { addToCart } from '../../store/cart/cartSlice';
import { Button, OfflineBanner, WishlistItemSkeleton } from '../../components';
import { theme } from '../../theme';
import { WishlistItem } from '../../types';
import { AppStackParamList } from '../../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';
import { useNetworkStatus } from '../../utils/network';
import { formatErrorForDisplay } from '../../utils/errorMessages';

type Props = NativeStackScreenProps<AppStackParamList, 'MainTabs'>;

type WishlistNavigation = Props['navigation'];

export const WishlistScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<WishlistNavigation>();
  const { isConnected } = useNetworkStatus();
  const items = useAppSelector(selectWishlistItems);
  const loading = useAppSelector(selectWishlistLoading);
  const error = useAppSelector(selectWishlistError);
  const itemCount = useAppSelector(selectWishlistItemCount);
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  const handleRefresh = async () => {
    if (!isConnected) {
      Alert.alert('Offline', 'Cannot refresh while offline. Showing cached wishlist.');
      return;
    }
    setRefreshing(true);
    await dispatch(fetchWishlist()).unwrap().catch(() => {});
    setRefreshing(false);
  };

  const handleRemoveItem = (productId: string) => {
    if (!isConnected) {
      Alert.alert('Offline', 'Removed from wishlist (will sync when online)');
    }
    dispatch(removeFromWishlistAsync(productId));
  };

  const handleAddToCart = async (productId: string) => {
    if (!isConnected) {
      Alert.alert('Offline', 'Added to cart (will sync when online)');
    }
    try {
      await dispatch(addToCart({ productId, quantity: 1 })).unwrap();
      Alert.alert('Success', 'Added to cart');
    } catch (err) {
      const message = formatErrorForDisplay(err);
      Alert.alert('Error', message);
    }
  };

  const handleClearWishlist = () => {
    dispatch(clearWishlistAsync());
  };

  const handleContinueShopping = () => {
    navigation.navigate('ProductList');
  };

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const renderWishlistItem = ({ item }: { item: WishlistItem }) => {
    const product = item.product;
    const displayPrice = product.discountPrice
      ? parseFloat(product.discountPrice)
      : parseFloat(product.price);
    const originalPrice = parseFloat(product.price);
    const hasDiscount = product.discountPrice && displayPrice < originalPrice;
    const averageRatingValue = Number(product.averageRating);

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => handleProductPress(product.id)}
        activeOpacity={0.9}
      >
        <Image source={{ uri: product.images[0] }} style={styles.itemImage as any} />

        <View style={styles.itemContent}>
          <Text style={styles.itemName} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.itemCategory}>{product.category.name}</Text>

          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>★ {averageRatingValue.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({product.totalReviews})</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.displayPrice}>₹{displayPrice.toFixed(2)}</Text>
            {hasDiscount && (
              <Text style={styles.originalPrice}>₹{originalPrice.toFixed(2)}</Text>
            )}
          </View>

          <Text
            style={[
              styles.stockText,
              {
                color:
                  product.stockQuantity > 0 ? theme.colors.success : theme.colors.error,
              },
            ]}
          >
            {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveItem(product.id)}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cartButton}
              onPress={() => handleAddToCart(product.id)}
              disabled={product.stockQuantity <= 0}
            >
              <Text style={styles.cartButtonText}>
                {product.stockQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🤍</Text>
      <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
      <Text style={styles.emptyMessage}>Save items to your wishlist to view them later</Text>
      <Button title="Continue Shopping" onPress={handleContinueShopping} />
    </View>
  );

  if (loading.fetch && items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <FlatList
          data={Array.from({ length: 8 })}
          renderItem={() => <WishlistItemSkeleton />}
          keyExtractor={(_, index) => `skeleton-${index}`}
          contentContainerStyle={styles.listContent}
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <OfflineBanner />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load wishlist</Text>
          <Text style={styles.errorMessage}>{formatErrorForDisplay(error)}</Text>
          <Button 
            title="Retry" 
            onPress={() => dispatch(fetchWishlist())} 
            disabled={!isConnected}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <OfflineBanner />
      {!isConnected && items.length > 0 && (
        <View style={styles.cacheNotice}>
          <Text style={styles.cacheNoticeText}>
            📦 Viewing cached wishlist (offline mode)
          </Text>
        </View>
      )}
      {items.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={renderWishlistItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
              />
            }
          />

          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <Text style={styles.footerLabel}>Items:</Text>
              <Text style={styles.footerValue}>{itemCount}</Text>
            </View>
            <Button
              title="Clear Wishlist"
              onPress={handleClearWishlist}
              style={styles.clearButton}
              disabled={loading}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
  },
  errorMessage: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  itemCategory: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  ratingText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.warning,
    fontWeight: theme.typography.fontWeights.semibold as any,
  },
  reviewCount: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textLight,
    marginLeft: theme.spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  displayPrice: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.primary,
  },
  originalPrice: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    textDecorationLine: 'line-through',
    marginLeft: theme.spacing.sm,
  },
  stockText: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.medium as any,
    marginBottom: theme.spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  removeButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  removeButtonText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold as any,
  },
  cartButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  cartButtonText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold as any,
  },
  footer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  footerLabel: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
  },
  footerValue: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.text,
  },
  clearButton: {
    marginTop: theme.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  cacheNotice: {
    backgroundColor: theme.colors.info + '20',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.info,
  },
  cacheNoticeText: {
    color: theme.colors.info,
    fontSize: theme.typography.fontSizes.sm,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeights.medium as '500',
  },
});
