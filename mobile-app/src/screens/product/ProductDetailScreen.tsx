import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '../../hooks';
import { useReviews } from '../../hooks/useReviews';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectIsAuthenticated } from '../../store/auth/authSlice';
import { addToCart, selectCartLoading } from '../../store/cart/cartSlice';
import {
  addToWishlistAsync,
  removeFromWishlistAsync,
  selectIsInWishlist,
  selectWishlistLoading,
  fetchWishlist,
  selectWishlist,
} from '../../store/wishlist/wishlistSlice';
import { Button, ReviewList } from '../../components';
import { theme } from '../../theme';
import { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'ProductDetail'>;

const { width } = Dimensions.get('window');
const imageHeight = width;

export const ProductDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { productId } = route.params;
  const { selectedProduct, loading, error, loadProductById, clearSelectedProduct } =
    useProducts();
  const { reviews, loadProductReviews } = useReviews();
  const dispatch = useAppDispatch();
  const addingToCart = useAppSelector(selectCartLoading);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const wishlistLoading = useAppSelector(selectWishlistLoading);
  const wishlist = useAppSelector(selectWishlist);
  const isInWishlist = useAppSelector(selectIsInWishlist(productId));
  const wishlistReady = Boolean(wishlist);

  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadProductById(productId);
    loadProductReviews(productId);
    if (isAuthenticated && !wishlist && !wishlistLoading) {
      dispatch(fetchWishlist());
    }
    return () => {
      clearSelectedProduct();
    };
  }, [productId, isAuthenticated, wishlist, wishlistLoading, dispatch, loadProductById, loadProductReviews, clearSelectedProduct]);

  // Refetch reviews and hydrate wishlist when screen regains focus
  useFocusEffect(
    React.useCallback(() => {
      loadProductReviews(productId);
      if (isAuthenticated && !wishlist) {
        dispatch(fetchWishlist());
      }
    }, [productId, loadProductReviews, isAuthenticated, wishlist, dispatch])
  );

  if (loading && !selectedProduct) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading product details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !selectedProduct) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load product</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedProduct) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Product not found</Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const product = selectedProduct;
  const discountPercentage = product.discountPrice
    ? Math.round(((parseFloat(product.price) - parseFloat(product.discountPrice)) / parseFloat(product.price)) * 100)
    : 0;

  const displayPrice = product.discountPrice
    ? parseFloat(product.discountPrice)
    : parseFloat(product.price);
  const originalPrice = parseFloat(product.price);
  const totalPrice = (displayPrice * quantity).toFixed(2);

  const handleAddToCart = async () => {
    try {
      const result = await dispatch(addToCart({ productId, quantity })).unwrap();
      
      Alert.alert(
        'Success',
        `Added ${quantity} item(s) to cart!`,
        [
          {
            text: 'Continue Shopping',
            onPress: () => navigation.goBack(),
          },
          {
            text: 'View Cart',
            onPress: () => navigation.navigate('Cart'),
          },
        ]
      );
    } catch (error) {
      const errorMessage = typeof error === 'string' ? error : 'Failed to add item to cart';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleWishlistToggle = async () => {
    try {
      if (isInWishlist) {
        await dispatch(removeFromWishlistAsync(productId)).unwrap();
        Alert.alert('Removed', 'Product removed from wishlist');
      } else {
        await dispatch(addToWishlistAsync(productId)).unwrap();
        Alert.alert('Saved', 'Product added to wishlist');
      }
    } catch (error) {
      const errorMessage = typeof error === 'string' ? error : 'Wishlist action failed';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleQuantityIncrease = () => {
    if (quantity < product.stockQuantity) {
      setQuantity(quantity + 1);
    }
  };

  const handleQuantityDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.carouselContainer}>
          <Image
            source={{ uri: product.images[currentImageIndex] }}
            style={styles.mainImage as any}
          />

          {product.isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>FEATURED</Text>
            </View>
          )}

          {discountPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
            </View>
          )}

          {/* Image Indicators */}
          {product.images.length > 1 && (
            <View style={styles.indicatorContainer}>
              {product.images.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.indicator,
                    currentImageIndex === index && styles.indicatorActive,
                  ]}
                  onPress={() => setCurrentImageIndex(index)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Thumbnail Images */}
        {product.images.length > 1 && (
          <FlatList
            data={product.images}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailContainer}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.thumbnail,
                  currentImageIndex === index && styles.thumbnailActive,
                ]}
                onPress={() => setCurrentImageIndex(index)}
              >
                <Image source={{ uri: item }} style={styles.thumbnailImage as any} />
              </TouchableOpacity>
            )}
            keyExtractor={(_, index) => index.toString()}
            scrollEnabled={false}
          />
        )}

        {/* Product Info */}
        <View style={styles.contentContainer}>
          <View style={styles.headerSection}>
            <View>
              <Text style={styles.name}>{product.name}</Text>
              <Text style={styles.category}>{product.category.name}</Text>
            </View>
            {product.isFeatured && (
              <View style={styles.featuredLabel}>
                <Text style={styles.featuredLabelText}>Featured Product</Text>
              </View>
            )}
          </View>

          {/* Rating and Reviews */}
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>★ {product.averageRating.toFixed(1)}</Text>
            <Text style={styles.reviews}>({product.totalReviews} reviews)</Text>
          </View>

          {/* Price Section */}
          <View style={styles.priceSection}>
            <View style={styles.priceContainer}>
              <Text style={styles.displayPrice}>₹{displayPrice.toFixed(2)}</Text>
              {product.discountPrice && (
                <Text style={styles.originalPrice}>₹{originalPrice.toFixed(2)}</Text>
              )}
            </View>
            {discountPercentage > 0 && (
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>Save ₹{(originalPrice - displayPrice).toFixed(2)}</Text>
              </View>
            )}
          </View>

          {/* Wishlist Button */}
          <TouchableOpacity
            style={[
              styles.wishlistButton,
              isInWishlist ? styles.wishlistButtonActive : styles.wishlistButtonInactive,
            ]}
            onPress={handleWishlistToggle}
            disabled={!wishlistReady || wishlistLoading}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.wishlistButtonText,
                isInWishlist ? styles.wishlistButtonTextActive : styles.wishlistButtonTextInactive,
              ]}
            >
              {!wishlistReady
                ? 'Loading wishlist...'
                : isInWishlist
                ? '❤️ Remove from Wishlist'
                : '🤍 Add to Wishlist'}
            </Text>
          </TouchableOpacity>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          {/* Product Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Unit:</Text>
              <Text style={styles.detailValue}>{product.unit}</Text>
            </View>
            {product.weight && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Weight:</Text>
                <Text style={styles.detailValue}>{product.weight}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Stock:</Text>
              <Text
                style={[
                  styles.detailValue,
                  {
                    color:
                      product.stockQuantity > 0
                        ? theme.colors.success
                        : theme.colors.error,
                  },
                ]}
              >
                {product.stockQuantity > 0
                  ? `${product.stockQuantity} Available`
                  : 'Out of Stock'}
              </Text>
            </View>
          </View>

          {/* Quantity Selector */}
          {product.stockQuantity > 0 && (
            <View style={styles.quantitySection}>
              <Text style={styles.sectionTitle}>Quantity</Text>
              <View style={styles.quantitySelector}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={handleQuantityDecrease}
                  disabled={quantity === 1}
                >
                  <Text style={styles.quantityButtonText}>−</Text>
                </TouchableOpacity>

                <Text style={styles.quantityValue}>{quantity}</Text>

                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={handleQuantityIncrease}
                  disabled={quantity === product.stockQuantity}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Total Price */}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total Price</Text>
            <Text style={styles.totalPrice}>₹{totalPrice}</Text>
          </View>

          {/* Add to Cart Button */}
          {product.stockQuantity > 0 ? (
            <Button
              title={addingToCart ? 'Adding to Cart...' : `Add ${quantity} to Cart`}
              onPress={handleAddToCart}
              disabled={addingToCart}
              style={styles.addButton}
            />
          ) : (
            <Button
              title="Out of Stock"
              onPress={() => {}}
              disabled
              style={styles.addButton}
            />
          )}

          {/* Additional Info */}
          <View style={styles.additionalInfo}>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>🚚</Text>
              <View>
                <Text style={styles.infoTitle}>Fast Delivery</Text>
                <Text style={styles.infoSubtitle}>Delivered within 3-5 days</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>🛡️</Text>
              <View>
                <Text style={styles.infoTitle}>Quality Assured</Text>
                <Text style={styles.infoSubtitle}>100% authentic products</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>↩️</Text>
              <View>
                <Text style={styles.infoTitle}>Easy Returns</Text>
                <Text style={styles.infoSubtitle}>30-day return policy</Text>
              </View>
            </View>
          </View>

          {/* Reviews & Ratings Section */}
          <View style={styles.reviewsSection}>
            <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
            
            {/* Rating Summary */}
            <View style={styles.ratingsSummary}>
              <View style={styles.ratingStatsContainer}>
                <View style={styles.averageRating}>
                  <Text style={styles.averageRatingValue}>
                    {product.averageRating.toFixed(1)}
                  </Text>
                  <View style={styles.starsSmall}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= Math.round(product.averageRating) ? 'star' : 'star-outline'}
                        size={16}
                        color={star <= Math.round(product.averageRating) ? theme.colors.warning : theme.colors.textLight}
                      />
                    ))}
                  </View>
                  <Text style={styles.totalReviews}>({product.totalReviews})</Text>
                </View>

                <View style={styles.ratingBreakdown}>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <View key={rating} style={styles.ratingRow}>
                      <Text style={styles.ratingLabel}>{rating}★</Text>
                      <View style={styles.ratingBar}>
                        <View
                          style={[
                            styles.ratingBarFill,
                            { width: `${(rating / 5) * 60}%` },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Reviews List */}
            <ReviewList reviews={reviews} loading={false} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  carouselContainer: {
    position: 'relative',
    height: imageHeight,
    backgroundColor: theme.colors.surface,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  featuredBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: theme.colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  featuredText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.semibold as '600',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: theme.colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  discountText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as '600',
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: theme.colors.background,
    width: 24,
  },
  thumbnailContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  thumbnailActive: {
    borderColor: theme.colors.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  name: {
    fontSize: theme.typography.fontSizes['2xl'],
    fontWeight: theme.typography.fontWeights.semibold as '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  category: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
  },
  featuredLabel: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuredLabelText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.semibold as '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rating: {
    fontSize: theme.typography.fontSizes.lg,
    color: theme.colors.warning,
    fontWeight: theme.typography.fontWeights.semibold as '600',
  },
  reviews: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
    marginLeft: 8,
  },
  priceSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  displayPrice: {
    fontSize: theme.typography.fontSizes['3xl'],
    fontWeight: theme.typography.fontWeights.semibold as '600',
    color: theme.colors.primary,
  },
  originalPrice: {
    fontSize: theme.typography.fontSizes.lg,
    color: theme.colors.textLight,
    textDecorationLine: 'line-through',
    marginLeft: 12,
  },
  savingsBadge: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  savingsText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold as '600',
  },
  wishlistButton: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  wishlistButtonActive: {
    borderColor: theme.colors.error,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  wishlistButtonInactive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  wishlistButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as '600',
  },
  wishlistButtonTextActive: {
    color: theme.colors.error,
  },
  wishlistButtonTextInactive: {
    color: theme.colors.primary,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold as '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
    lineHeight: 22,
  },
  detailsSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
  },
  detailValue: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as '600',
    color: theme.colors.text,
  },
  quantitySection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quantityButtonText: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold as '600',
    color: theme.colors.text,
  },
  quantityValue: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold as '600',
    color: theme.colors.text,
    marginHorizontal: 16,
    minWidth: 40,
    textAlign: 'center',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
  },
  totalLabel: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
  },
  totalPrice: {
    fontSize: theme.typography.fontSizes['2xl'],
    fontWeight: theme.typography.fontWeights.semibold as '600',
    color: theme.colors.primary,
  },
  addButton: {
    marginBottom: 20,
  },
  additionalInfo: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoTitle: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold as '600',
    color: theme.colors.error,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold as '600',
    color: theme.colors.text,
    marginBottom: 20,
  },
  reviewsSection: {
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.card,
  },
  ratingsSummary: {
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  ratingStatsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    alignItems: 'flex-start',
  },
  averageRating: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  averageRatingValue: {
    fontSize: 32,
    fontWeight: theme.typography.fontWeights.bold as '700',
    color: theme.colors.text,
  },
  starsSmall: {
    flexDirection: 'row',
    gap: 2,
    marginVertical: theme.spacing.xs,
  },
  totalReviews: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  ratingBreakdown: {
    flex: 1,
    gap: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  ratingLabel: {
    width: 20,
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textLight,
    fontWeight: theme.typography.fontWeights.semibold as '600',
  },
  ratingBar: {
    flex: 1,
    height: 4,
    backgroundColor: theme.colors.card,
    borderRadius: 2,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: theme.colors.warning,
    borderRadius: 2,
  },
  writeReviewButton: {
    marginTop: theme.spacing.md,
  },
});
