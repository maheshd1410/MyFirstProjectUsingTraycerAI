import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useProducts } from '../../hooks';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { ProductCard, FilterModal, OfflineBanner, ProductCardSkeleton } from '../../components';
import { FilterValues } from '../../components/FilterModal';
import { theme } from '../../theme';
import { useNetworkStatus } from '../../utils/network';
import { formatErrorForDisplay } from '../../utils/errorMessages';
import {
  addToWishlistAsync,
  removeFromWishlistAsync,
  fetchWishlist,
  selectWishlistItems,
} from '../../store/wishlist/wishlistSlice';

type RootStackParamList = {
  ProductList: undefined;
  ProductDetail: { productId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'ProductList'>;

export const ProductListScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isConnected } = useNetworkStatus();
  const {
    products,
    categories,
    loading,
    error,
    filters,
    pagination,
    loadProducts,
    loadCategories,
    updateFilters,
    resetFilters,
    clearError,
  } = useProducts();

  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [showFilter, setShowFilter] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const wishlistItems = useAppSelector(selectWishlistItems);

  useEffect(() => {
    loadCategories();
    loadProducts();
    if (wishlistItems.length === 0) {
      dispatch(fetchWishlist());
    }
  }, []);

  const handleRefresh = async () => {
    if (!isConnected) {
      Alert.alert('Offline', 'Cannot refresh while offline. Showing cached data.');
      return;
    }
    setRefreshing(true);
    resetFilters();
    await loadProducts();
    setRefreshing(false);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      updateFilters({ search: text, page: 1 });
      loadProducts({ ...filters, search: text, page: 1 });
    }, 300);
  };

  const handleCategorySelect = (categoryId: string | undefined) => {
    setSelectedCategory(categoryId);
    updateFilters({ categoryId, page: 1 });
    loadProducts({ ...filters, categoryId, page: 1 });
  };

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const isProductInWishlist = (productId: string) => {
    return wishlistItems.some((item) => item.productId === productId);
  };

  const handleWishlistToggle = (productId: string) => {
    if (!isConnected) {
      Alert.alert('Offline', 'Added to wishlist (will sync when online)');
    }
    if (isProductInWishlist(productId)) {
      dispatch(removeFromWishlistAsync(productId));
    } else {
      dispatch(addToWishlistAsync(productId));
    }
  };

  const handleLoadMore = () => {
    if (!loading.loadMore && !loading.fetch && pagination.currentPage < pagination.totalPages) {
      const nextPage = pagination.currentPage + 1;
      loadProducts({ ...filters, page: nextPage });
    }
  };

  const handleFilterApply = (filters: FilterValues) => {
    const { minPrice, maxPrice, categoryId, minRating, inStock, sortBy } = filters;
    updateFilters({ minPrice, maxPrice, categoryId, minRating, inStock, sortBy, page: 1 });
    loadProducts({
      ...{ ...filters, minPrice, maxPrice, categoryId, minRating, inStock, sortBy, page: 1 },
    });
    setShowFilter(false);
  };

  const handleSortChange = (sortBy: 'newest' | 'price-asc' | 'price-desc' | 'rating') => {
    updateFilters({ sortBy, page: 1 });
    loadProducts({ ...filters, sortBy, page: 1 });
  };

  if (error && !loading.fetch && products.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <OfflineBanner />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load products</Text>
          <Text style={styles.errorMessage}>{formatErrorForDisplay(error)}</Text>
          <TouchableOpacity
            style={[styles.retryButton, !isConnected && styles.buttonDisabled]}
            onPress={() => {
              if (!isConnected) {
                Alert.alert('Offline', 'Cannot retry while offline');
                return;
              }
              clearError();
              loadProducts();
            }}
            disabled={!isConnected}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <OfflineBanner />
      {!isConnected && products.length > 0 && (
        <View style={styles.cacheNotice}>
          <Text style={styles.cacheNoticeText}>
            📦 Viewing cached data (offline mode)
          </Text>
        </View>
      )}
      {/* Search Bar with Filter Button */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={theme.colors.textLight}
          value={searchText}
          onChangeText={handleSearch}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilter(true)}
        >
          <Text style={styles.filterButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={handleFilterApply}
        initialFilters={{
          minPrice: filters.minPrice || 0,
          maxPrice: filters.maxPrice || 10000,
          categoryId: filters.categoryId,
          minRating: filters.minRating,
          inStock: filters.inStock,
          sortBy: filters.sortBy || 'newest'
        }}
      />

      {/* Category Filter */}
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === item.id && styles.categoryChipActive,
            ]}
            onPress={() =>
              handleCategorySelect(selectedCategory === item.id ? undefined : item.id)
            }
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === item.id && styles.categoryChipTextActive,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <TouchableOpacity
            style={[
              styles.categoryChip,
              !selectedCategory && styles.categoryChipActive,
            ]}
            onPress={() => {
              setSelectedCategory(undefined);
              handleCategorySelect(undefined);
            }}
          >
            <Text
              style={[
                styles.categoryChipText,
                !selectedCategory && styles.categoryChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
        }
      />

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[
            styles.sortButton,
            filters.sortBy === 'newest' && styles.sortButtonActive,
          ]}
          onPress={() => handleSortChange('newest')}
        >
          <Text
            style={[
              styles.sortButtonText,
              filters.sortBy === 'newest' && styles.sortButtonTextActive,
            ]}
          >
            Newest
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sortButton,
            filters.sortBy === 'price-asc' && styles.sortButtonActive,
          ]}
          onPress={() => handleSortChange('price-asc')}
        >
          <Text
            style={[
              styles.sortButtonText,
              filters.sortBy === 'price-asc' && styles.sortButtonTextActive,
            ]}
          >
            Price ↑
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sortButton,
            filters.sortBy === 'price-desc' && styles.sortButtonActive,
          ]}
          onPress={() => handleSortChange('price-desc')}
        >
          <Text
            style={[
              styles.sortButtonText,
              filters.sortBy === 'price-desc' && styles.sortButtonTextActive,
            ]}
          >
            Price ↓
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sortButton,
            filters.sortBy === 'rating' && styles.sortButtonActive,
          ]}
          onPress={() => handleSortChange('rating')}
        >
          <Text
            style={[
              styles.sortButtonText,
              filters.sortBy === 'rating' && styles.sortButtonTextActive,
            ]}
          >
            Rating
          </Text>
        </TouchableOpacity>
      </View>

      {/* Products Grid */}
      {loading.fetch && products.length === 0 ? (
        <FlatList
          data={Array.from({ length: 10 })}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={() => <ProductCardSkeleton variant="grid" />}
          keyExtractor={(_, index) => `skeleton-${index}`}
          contentContainerStyle={styles.gridContent}
        />
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={handleProductPress}
              variant="grid"
              isInWishlist={isProductInWishlist(item.id)}
              onWishlistToggle={handleWishlistToggle}
            />
          )}
          keyExtractor={(item) => item.id}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
          ListFooterComponent={
            loading.loadMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : null
          }
          contentContainerStyle={styles.gridContent}
        />
      )}

      {/* Pagination Info */}
      {products.length > 0 && (
        <View style={styles.paginationInfo}>
          <Text style={styles.paginationText}>
            Page {pagination.currentPage} of {pagination.totalPages}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.text,
  },
  filterButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: theme.typography.fontSizes.lg,
    color: theme.colors.background,
  },
  categoryContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    marginRight: 8,
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
    fontWeight: theme.typography.fontWeights.medium as '500',
  },
  categoryChipTextActive: {
    color: theme.colors.background,
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sortButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sortButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  sortButtonText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeights.medium as '500',
  },
  sortButtonTextActive: {
    color: theme.colors.background,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold as '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
  },
  gridContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  columnWrapper: {
    marginBottom: 4,
  },
  footerLoader: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  paginationInfo: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  paginationText: {
    fontSize: theme.typography.fontSizes.sm,
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
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as '600',
  },
  buttonDisabled: {
    opacity: 0.5,
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
