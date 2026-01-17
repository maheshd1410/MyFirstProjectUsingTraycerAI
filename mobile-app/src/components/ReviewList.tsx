import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Review } from '../types';
import { theme } from '../theme';

interface ReviewListProps {
  reviews: Review[];
  loading: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 14 }) => {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={size}
          color={star <= rating ? theme.colors.warning : theme.colors.textLight}
        />
      ))}
    </View>
  );
};

const ReviewItem: React.FC<{ review: Review }> = ({ review }) => {
  const formattedDate = new Date(review.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.reviewCard}>
      {/* Header */}
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          <Text style={styles.reviewerName}>{review.userName}</Text>
          {review.isVerifiedPurchase && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={12} color={theme.colors.primary} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
        <Text style={styles.reviewDate}>{formattedDate}</Text>
      </View>

      {/* Rating */}
      <View style={styles.ratingContainer}>
        <StarRating rating={review.rating} />
      </View>

      {/* Title */}
      {review.title && <Text style={styles.reviewTitle}>{review.title}</Text>}

      {/* Comment */}
      {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}

      {review.images && review.images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imagesContainer}
        >
          {review.images.map((imageUri, index) => (
            <Image
              key={index}
              source={{ uri: imageUri }}
              style={styles.reviewImage}
            />
          ))}
        </ScrollView>
      )}

      {/* Moderation Status */}
      {review.moderationStatus === 'PENDING' && (
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingText}>Pending Moderation</Text>
        </View>
      )}

      {review.moderationStatus === 'REJECTED' && (
        <View style={styles.rejectedBadge}>
          <Text style={styles.rejectedText}>Review Not Approved</Text>
        </View>
      )}

      {/* Helpful Count */}
      {review.helpfulCount > 0 && (
        <View style={styles.helpfulContainer}>
          <Ionicons name="thumbs-up-outline" size={14} color={theme.colors.primary} />
          <Text style={styles.helpfulText}>{review.helpfulCount} found helpful</Text>
        </View>
      )}
    </View>
  );
};

export const ReviewList: React.FC<ReviewListProps> = ({ reviews, loading, onLoadMore, hasMore }) => {
  if (loading && reviews.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (reviews.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name="star-outline"
          size={48}
          color={theme.colors.textLight}
          style={{ marginBottom: theme.spacing.md }}
        />
        <Text style={styles.emptyText}>No reviews yet</Text>
        <Text style={styles.emptySubtext}>Be the first to review this product!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reviews}
        renderItem={({ item }) => <ReviewItem review={item} />}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity style={styles.loadMoreButton} onPress={onLoadMore}>
              {loading ? (
                <ActivityIndicator color={theme.colors.primary} />
              ) : (
                <Text style={styles.loadMoreText}>Load More Reviews</Text>
              )}
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.md,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  reviewCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  reviewerInfo: {
    flex: 1,
    flexDirection: 'column',
    gap: theme.spacing.xs,
  },
  reviewerName: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    backgroundColor: `${theme.colors.primary}20`,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.semibold as any,
  },
  reviewDate: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textLight,
  },
  ratingContainer: {
    marginBottom: theme.spacing.md,
  },
  reviewTitle: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  reviewComment: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  imagesContainer: {
    marginBottom: theme.spacing.md,
  },
  reviewImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  pendingBadge: {
    backgroundColor: `${theme.colors.warning}20`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: theme.spacing.sm,
  },
  pendingText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.warning,
    fontWeight: theme.typography.fontWeights.semibold as any,
  },
  rejectedBadge: {
    backgroundColor: `${theme.colors.error}20`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: theme.spacing.sm,
  },
  rejectedText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.error,
    fontWeight: theme.typography.fontWeights.semibold as any,
  },
  helpfulContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  helpfulText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textLight,
  },
  separator: {
    height: 0,
  },
  emptyText: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  loadMoreButton: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  loadMoreText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.semibold as any,
  },
});
