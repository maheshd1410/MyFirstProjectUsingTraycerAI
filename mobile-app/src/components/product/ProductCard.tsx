import React, { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useAppTheme } from '../../theme';
import { Card } from '../card';
import type { ProductCardProps } from './ProductCard.types';
import { 
  formatProductForScreenReader, 
  getAccessibilityHint, 
  ensureTouchTarget 
} from '../../utils/accessibility';

const { width } = Dimensions.get('window');
const gridItemWidth = (width - 24) / 2;

const ProductCardComponent: React.FC<ProductCardProps> = ({
  product,
  onPress,
  variant = 'grid',
  onWishlistToggle,
  isInWishlist = false,
}) => {
  const theme = useAppTheme();

  const handlePress = useCallback(() => {
    onPress(product.id);
  }, [onPress, product.id]);

  const handleWishlistToggle = useCallback(() => {
    if (onWishlistToggle) {
      onWishlistToggle(product.id, isInWishlist);
    }
  }, [onWishlistToggle, product.id, isInWishlist]);

  const discountPercentage = product.discountPrice
    ? Math.round(((parseFloat(product.price) - parseFloat(product.discountPrice)) / parseFloat(product.price)) * 100)
    : 0;

  const displayPrice = product.discountPrice
    ? parseFloat(product.discountPrice)
    : parseFloat(product.price);
  const originalPrice = parseFloat(product.price);

  const accessibilityLabel = formatProductForScreenReader(product);
  const touchTargetStyle = ensureTouchTarget(44);

  if (variant === 'list') {
    return (
      <Pressable 
        onPress={handlePress} 
        style={{ marginBottom: theme.spacing.md }}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={getAccessibilityHint('view product details')}
      >
        {({ pressed }) => (
          <Card
            padding="none"
            elevation={pressed ? 2 : 1}
            style={styles.listContainer}
          >
            {onWishlistToggle && (
              <Pressable
                style={[styles.heartButton, { top: theme.spacing.sm, left: theme.spacing.sm }, touchTargetStyle]}
                onPress={handleWishlistToggle}
                accessibilityRole="button"
                accessibilityLabel={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                accessibilityHint={getAccessibilityHint('toggle wishlist')}
              >
                <View style={[styles.heartBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                  <Text style={styles.heartIcon}>{isInWishlist ? '❤️' : '🤍'}</Text>
                </View>
              </Pressable>
            )}
            <Image
              source={{ uri: product.images[0] }}
              style={[styles.listImage, { backgroundColor: theme.colors.surfaceVariant }] as any}
              resizeMode="cover"
            />
            <View style={[styles.listContent, { padding: theme.spacing.md }]}>
              <Text style={[theme.typography.bodyMedium, { fontWeight: '600', color: theme.colors.onSurface }]} numberOfLines={2}>
                {product.name}
              </Text>
              <Text style={[theme.typography.bodySmall, { color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.xs }]}>{product.category.name}</Text>
              <View style={[styles.ratingContainer, { marginTop: theme.spacing.xs }]}>
                <Text style={[theme.typography.labelSmall, { color: theme.colors.warning, fontWeight: '600' }]}>★ {product.averageRating.toFixed(1)}</Text>
                <Text style={[theme.typography.labelSmall, { color: theme.colors.onSurfaceVariant, marginLeft: theme.spacing.xs }]}>({product.totalReviews})</Text>
              </View>
              <View style={[styles.priceContainer, { marginTop: theme.spacing.xs }]}>
                <Text style={[theme.typography.titleMedium, { color: theme.colors.primary, fontWeight: '600' }]}>₹{displayPrice.toFixed(2)}</Text>
                {product.discountPrice && (
                  <>
                    <Text style={[theme.typography.bodySmall, { color: theme.colors.onSurfaceVariant, textDecorationLine: 'line-through', marginLeft: theme.spacing.sm }]}>₹{originalPrice.toFixed(2)}</Text>
                    <View style={[styles.discountBadge, { backgroundColor: theme.colors.error, marginLeft: theme.spacing.sm, paddingHorizontal: theme.spacing.xs, paddingVertical: 2, borderRadius: theme.radius.sm }]}>
                      <Text style={[theme.typography.labelSmall, { color: theme.colors.onError, fontWeight: '600' }]}>{discountPercentage}% OFF</Text>
                    </View>
                  </>
                )}
              </View>
              <Text
                style={[
                  theme.typography.labelSmall,
                  {
                    color: product.stockQuantity > 0 ? theme.colors.secondary : theme.colors.error,
                    marginTop: theme.spacing.xs,
                    fontWeight: '500',
                  },
                ]}
              >
                {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
              </Text>
            </View>
          </Card>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable 
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={getAccessibilityHint('view product details')}
    >
      {({ pressed }) => (
        <Card
          padding="none"
          elevation={pressed ? 2 : 1}
          style={[styles.gridContainer, { width: gridItemWidth, borderWidth: 1, borderColor: theme.colors.outlineVariant }]}
        >
          {onWishlistToggle && (
            <Pressable
              style={[styles.heartButton, { top: theme.spacing.sm, left: theme.spacing.sm }, touchTargetStyle]}
              onPress={handleWishlistToggle}
              accessibilityRole="button"
              accessibilityLabel={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              accessibilityHint={getAccessibilityHint('toggle wishlist')}
            >
              <View style={[styles.heartBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                <Text style={styles.heartIcon}>{isInWishlist ? '❤️' : '🤍'}</Text>
              </View>
            </Pressable>
          )}
          {product.isFeatured && (
            <View style={[styles.featuredBadge, { backgroundColor: theme.colors.secondary, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, borderRadius: theme.radius.sm }]}>
              <Text style={[theme.typography.labelSmall, { color: theme.colors.onSecondary, fontWeight: '600' }]}>FEATURED</Text>
            </View>
          )}
          
          {discountPercentage > 0 && (
            <View style={[styles.discountBadge, { backgroundColor: theme.colors.error, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, borderRadius: theme.radius.sm, position: 'absolute', top: theme.spacing.sm, right: theme.spacing.sm, zIndex: 1 }]}>
              <Text style={[theme.typography.labelSmall, { color: theme.colors.onError, fontWeight: '600' }]}>{discountPercentage}%</Text>
            </View>
          )}

          <Image
            source={{ uri: product.images[0] }}
            style={[styles.gridImage, { backgroundColor: theme.colors.surfaceVariant }] as any}
            defaultSource={require('../../assets/placeholder.png')}
            resizeMode="cover"
          />

          <View style={[styles.gridContent, { padding: theme.spacing.sm }]}>
            <Text style={[theme.typography.bodyMedium, { fontWeight: '600', color: theme.colors.onSurface }]} numberOfLines={2}>
              {product.name}
            </Text>

            <Text style={[theme.typography.bodySmall, { color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.xs }]} numberOfLines={1}>
              {product.category.name}
            </Text>

            <View style={[styles.ratingContainer, { marginTop: theme.spacing.xs }]}>
              <Text style={[theme.typography.labelSmall, { color: theme.colors.tertiary, fontWeight: '600' }]}>★ {product.averageRating.toFixed(1)}</Text>
              <Text style={[theme.typography.labelSmall, { color: theme.colors.onSurfaceVariant, marginLeft: theme.spacing.xs }]}>({product.totalReviews})</Text>
            </View>

            <View style={[styles.priceSection, { marginTop: theme.spacing.xs }]}>
              <Text style={[theme.typography.titleMedium, { color: theme.colors.primary, fontWeight: '600' }]}>₹{displayPrice.toFixed(2)}</Text>
              {product.discountPrice && (
                <Text style={[theme.typography.bodySmall, { color: theme.colors.onSurfaceVariant, textDecorationLine: 'line-through', marginLeft: theme.spacing.sm }]}>₹{originalPrice.toFixed(2)}</Text>
              )}
            </View>

            <Text
              style={[
                theme.typography.labelSmall,
                {
                  color: product.stockQuantity > 0 ? theme.colors.secondary : theme.colors.error,
                  marginTop: theme.spacing.xs,
                  fontWeight: '500',
                },
              ]}
            >
              {product.stockQuantity > 0 ? `${product.stockQuantity} left` : 'Out of Stock'}
            </Text>
          </View>
        </Card>
      )}
    </Pressable>
  );
};

// Memoize with custom comparison function
export const ProductCard = React.memo(
  ProductCardComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.product.id === nextProps.product.id &&
      prevProps.variant === nextProps.variant &&
      prevProps.isInWishlist === nextProps.isInWishlist &&
      prevProps.product.stockQuantity === nextProps.product.stockQuantity &&
      prevProps.product.images[0] === nextProps.product.images[0]
    );
  }
);

const styles = StyleSheet.create({
  gridContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  listContainer: {
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: gridItemWidth * 0.8,
  },
  listImage: {
    width: 100,
    height: 100,
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
  },
  gridContent: {
  },
  listContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountBadge: {
  },
  heartButton: {
    position: 'absolute',
    zIndex: 2,
  },
  heartBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIcon: {
    fontSize: 16,
  },
});
