import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '../../components';
import { useReviews } from '../../hooks/useReviews';
import { theme } from '../../theme';
import { AppStackParamList } from '../../navigation/AppNavigator';

type WriteReviewScreenRouteProp = RouteProp<AppStackParamList, 'WriteReview'>;

export const WriteReviewScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<WriteReviewScreenRouteProp>();
  const { submitReview } = useReviews();

  const { orderId, productId, productName, productImage } = route.params;

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    if (rating === 0) {
      Alert.alert('Validation', 'Please select a rating');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      await submitReview({
        orderId,
        productId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim() || undefined,
      });

      Alert.alert('Success', 'Review submitted successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (title.trim() || comment.trim() || rating > 0) {
      Alert.alert('Discard Review?', 'Are you sure you want to discard this review?', [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Product Info */}
          <View style={styles.productInfoContainer}>
            {productImage && (
              <Image source={{ uri: productImage }} style={styles.productImage} />
            )}
            <Text style={styles.productName}>{productName}</Text>
          </View>

          {/* Rating Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rating</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={40}
                    color={star <= rating ? theme.colors.warning : theme.colors.textLight}
                    style={styles.star}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Title Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Review Title</Text>
            <Input
              placeholder="Summary of your review (optional)"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              editable={!submitting}
            />
            <Text style={styles.charCount}>{title.length}/100</Text>
          </View>

          {/* Comment Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Review</Text>
            <Input
              placeholder="Share your experience (optional)"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              maxLength={1000}
              editable={!submitting}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{comment.length}/1000</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title="Cancel"
              onPress={handleCancel}
              variant="secondary"
              disabled={submitting}
            />
            <Button
              title={submitting ? 'Submitting...' : 'Submit Review'}
              onPress={handleSubmit}
              disabled={submitting || rating === 0}
            />
          </View>

          {submitting && (
            <View style={styles.submittingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  productInfoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.card,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.card,
  },
  productName: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  star: {
    marginHorizontal: theme.spacing.sm,
  },
  charCount: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textLight,
    marginTop: theme.spacing.sm,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  submittingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
