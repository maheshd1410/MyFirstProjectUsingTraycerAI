import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useAppSelector } from '../store/hooks';
import { selectCategories } from '../store/product/productSlice';
import { theme } from '../theme';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterValues) => void;
  initialFilters?: FilterValues;
}

export interface FilterValues {
  minPrice: number;
  maxPrice: number;
  categoryId?: string;
  minRating?: number;
  inStock?: boolean;
  sortBy: 'newest' | 'price-asc' | 'price-desc' | 'rating';
}

const { height } = Dimensions.get('window');

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters = {
    minPrice: 0,
    maxPrice: 10000,
    sortBy: 'newest',
  },
}) => {
  const categories = useAppSelector(selectCategories);
  const [minPrice, setMinPrice] = useState(initialFilters.minPrice);
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice);
  const [categoryId, setCategoryId] = useState(initialFilters.categoryId);
  const [minRating, setMinRating] = useState(initialFilters.minRating);
  const [inStock, setInStock] = useState(initialFilters.inStock);
  const [sortBy, setSortBy] = useState(initialFilters.sortBy);

  useEffect(() => {
    if (visible) {
      setMinPrice(initialFilters.minPrice);
      setMaxPrice(initialFilters.maxPrice);
      setCategoryId(initialFilters.categoryId);
      setMinRating(initialFilters.minRating);
      setInStock(initialFilters.inStock);
      setSortBy(initialFilters.sortBy);
    }
  }, [visible, initialFilters]);

  const handleApply = () => {
    onApply({
      minPrice,
      maxPrice,
      categoryId,
      minRating,
      inStock,
      sortBy,
    });
    onClose();
  };

  const handleReset = () => {
    setMinPrice(0);
    setMaxPrice(10000);
    setCategoryId(undefined);
    setMinRating(undefined);
    setInStock(undefined);
    setSortBy('newest');
  };

  const sortOptions: Array<{
    label: string;
    value: 'newest' | 'price-asc' | 'price-desc' | 'rating';
  }> = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
    { label: 'Top Rated', value: 'rating' },
  ];

  const ratingOptions = [1, 2, 3, 4, 5];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filters</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetButton}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Price Range Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Price Range</Text>

            <View style={styles.priceDisplay}>
              <Text style={styles.priceText}>₹{minPrice}</Text>
              <Text style={styles.priceSeparator}>to</Text>
              <Text style={styles.priceText}>₹{maxPrice}</Text>
            </View>

            {/* Min Price Slider */}
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Minimum: ₹{minPrice}</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={10000}
                step={100}
                value={minPrice}
                onValueChange={setMinPrice}
                maximumTrackTintColor={theme.colors.border}
                minimumTrackTintColor={theme.colors.primary}
                thumbTintColor={theme.colors.primary}
              />
            </View>

            {/* Max Price Slider */}
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Maximum: ₹{maxPrice}</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={10000}
                step={100}
                value={maxPrice}
                onValueChange={setMaxPrice}
                maximumTrackTintColor={theme.colors.border}
                minimumTrackTintColor={theme.colors.primary}
                thumbTintColor={theme.colors.primary}
              />
            </View>
          </View>

          {/* Category Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScroll}
            >
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  !categoryId && styles.categoryChipActive,
                ]}
                onPress={() => setCategoryId(undefined)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    !categoryId && styles.categoryChipTextActive,
                  ]}
                >
                  All Categories
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    categoryId === cat.id && styles.categoryChipActive,
                  ]}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      categoryId === cat.id && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Rating Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Minimum Rating</Text>
            <TouchableOpacity
              style={[
                styles.ratingOption,
                !minRating && styles.ratingOptionActive,
              ]}
              onPress={() => setMinRating(undefined)}
            >
              <View
                style={[
                  styles.ratingCheckbox,
                  !minRating && styles.ratingCheckboxActive,
                ]}
              >
                {!minRating && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text
                style={[
                  styles.ratingOptionText,
                  !minRating && styles.ratingOptionTextActive,
                ]}
              >
                Any Rating
              </Text>
            </TouchableOpacity>
            {ratingOptions.map((rating) => (
              <TouchableOpacity
                key={rating}
                style={[
                  styles.ratingOption,
                  minRating === rating && styles.ratingOptionActive,
                ]}
                onPress={() => setMinRating(rating)}
              >
                <View
                  style={[
                    styles.ratingCheckbox,
                    minRating === rating && styles.ratingCheckboxActive,
                  ]}
                >
                  {minRating === rating && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.ratingOptionText,
                    minRating === rating && styles.ratingOptionTextActive,
                  ]}
                >
                  {'\u2605'.repeat(rating)} {rating} & above
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Availability Filter */}
          <View style={styles.filterSection}>
            <View style={styles.availabilityContainer}>
              <Text style={styles.sectionTitle}>Availability</Text>
              <Switch
                value={inStock === true}
                onValueChange={(value) => setInStock(value ? true : undefined)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.background}
              />
            </View>
            <Text style={styles.availabilityLabel}>Show only in-stock items</Text>
          </View>

          {/* Sort By Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Sort By</Text>

            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortOption,
                  sortBy === option.value && styles.sortOptionActive,
                ]}
                onPress={() => setSortBy(option.value)}
              >
                <View
                  style={[
                    styles.checkbox,
                    sortBy === option.value && styles.checkboxActive,
                  ]}
                >
                  {sortBy === option.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.sortOptionText,
                    sortBy === option.value && styles.sortOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApply}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  closeButton: {
    fontSize: 24,
    color: theme.colors.text,
  },
  headerTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.text,
  },
  resetButton: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.semibold as any,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  filterSection: {
    marginBottom: 32,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.text,
    marginBottom: 16,
  },
  priceDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
  },
  priceText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.primary,
  },
  priceSeparator: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  categoriesScroll: {
    marginBottom: 16,
    marginHorizontal: -4,
    paddingHorizontal: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryChipText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeights.medium as any,
  },
  categoryChipTextActive: {
    color: theme.colors.background,
    fontWeight: theme.typography.fontWeights.semibold as any,
  },
  ratingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
  },
  ratingOptionActive: {
    backgroundColor: '#E3F2FD',
  },
  ratingCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingCheckboxActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  ratingOptionText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.text,
  },
  ratingOptionTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.semibold as any,
  },
  availabilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  availabilityLabel: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    marginLeft: 4,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
  },
  sortOptionActive: {
    backgroundColor: '#E3F2FD',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: theme.typography.fontWeights.semibold as any,
  },
  sortOptionText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.text,
  },
  sortOptionTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.semibold as any,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  cancelButton: {
    flex: 1,
    marginRight: 12,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.text,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.background,
  },
});
