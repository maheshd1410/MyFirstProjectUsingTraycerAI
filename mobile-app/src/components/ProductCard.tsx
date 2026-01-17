import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Product } from '../types';
import { theme } from '../theme';

interface ProductCardProps {
  product: Product;
  onPress: (productId: string) => void;
  variant?: 'grid' | 'list';
  onWishlistToggle?: (productId: string, isInWishlist: boolean) => void;
  isInWishlist?: boolean;
}

const { width } = Dimensions.get('window');
const gridItemWidth = (width - 24) / 2;

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  variant = 'grid',
  onWishlistToggle,
  isInWishlist = false,
}) => {
  const discountPercentage = product.discountPrice
    ? Math.round(((parseFloat(product.price) - parseFloat(product.discountPrice)) / parseFloat(product.price)) * 100)
    : 0;

  const displayPrice = product.discountPrice
    ? parseFloat(product.discountPrice)
    : parseFloat(product.price);
  const originalPrice = parseFloat(product.price);

  if (variant === 'list') {
    return (
      <TouchableOpacity
        style={styles.listContainer}
        onPress={() => onPress(product.id)}
        activeOpacity={0.7}
      >
        {onWishlistToggle && (
          <TouchableOpacity
            style={styles.heartButton}
            onPress={() => onWishlistToggle(product.id, isInWishlist)}
            activeOpacity={0.7}
          >
            <View style={styles.heartBadge}>
              <Text style={styles.heartIcon}>{isInWishlist ? '❤️' : '🤍'}</Text>
            </View>
          </TouchableOpacity>
        )}
        <Image
          source={{ uri: product.images[0] }}
          style={styles.listImage as any}
        />
        <View style={styles.listContent}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.category}>{product.category.name}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>★ {product.averageRating.toFixed(1)}</Text>
            <Text style={styles.reviews}>({product.totalReviews})</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.displayPrice}>₹{displayPrice.toFixed(2)}</Text>
            {product.discountPrice && (
              <>
                <Text style={styles.originalPrice}>₹{originalPrice.toFixed(2)}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
                </View>
              </>
            )}
          </View>
          <Text style={styles.stock}>
            {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.gridContainer}
      onPress={() => onPress(product.id)}
      activeOpacity={0.7}
    >
      {onWishlistToggle && (
        <TouchableOpacity
          style={styles.heartButton}
          onPress={() => onWishlistToggle(product.id, isInWishlist)}
          activeOpacity={0.7}
        >
          <View style={styles.heartBadge}>
            <Text style={styles.heartIcon}>{isInWishlist ? '❤️' : '🤍'}</Text>
          </View>
        </TouchableOpacity>
      )}
      {product.isFeatured && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredText}>FEATURED</Text>
        </View>
      )}
      
      {discountPercentage > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discountPercentage}%</Text>
        </View>
      )}

      <Image
        source={{ uri: product.images[0] }}
        style={styles.gridImage as any}
        defaultSource={require('../../assets/placeholder.png')}
      />

      <View style={styles.gridContent}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        <Text style={styles.category} numberOfLines={1}>
          {product.category.name}
        </Text>

        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>★ {product.averageRating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({product.totalReviews})</Text>
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.displayPrice}>₹{displayPrice.toFixed(2)}</Text>
          {product.discountPrice && (
            <Text style={styles.originalPrice}>₹{originalPrice.toFixed(2)}</Text>
          )}
        </View>

        <Text
          style={[
            styles.stock,
            { color: product.stockQuantity > 0 ? theme.colors.success : theme.colors.error },
          ]}
        >
          {product.stockQuantity > 0 ? `${product.stockQuantity} left` : 'Out of Stock'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    width: gridItemWidth,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: 'relative',
  },
  listContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: gridItemWidth * 0.8,
    backgroundColor: theme.colors.surface,
  },
  listImage: {
    width: 100,
    height: 100,
    backgroundColor: theme.colors.surface,
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: theme.colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  featuredText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.semibold as '600',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  discountText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.semibold as '600',
  },
  gridContent: {
    padding: 8,
  },
  listContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold as '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  category: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textLight,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rating: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.warning,
    fontWeight: theme.typography.fontWeights.semibold as '600',
  },
  reviews: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textLight,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textLight,
    marginLeft: 4,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  displayPrice: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as '600',
    color: theme.colors.primary,
  },
  originalPrice: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  stock: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.medium as '500',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
  },
  heartBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIcon: {
    fontSize: 16,
  },
});
