import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Keyboard,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '../../hooks';
import { ProductCard } from '../../components';
import { theme } from '../../theme';
import {
  getSearchHistory,
  saveSearchHistory,
  clearSearchHistory,
  removeSearchHistoryItem,
} from '../../utils/searchHistory';

type AppStackParamList = {
  Search: undefined;
  ProductDetail: { productId: string };
};

type Props = NativeStackScreenProps<AppStackParamList, 'Search'>;

const POPULAR_SEARCHES = [
  'Besan Ladoo',
  'Motichoor Ladoo',
  'Rava Ladoo',
  'Coconut Ladoo',
  'Dry Fruit Ladoo',
];

export const SearchScreen: React.FC<Props> = ({ navigation }) => {
  const { products, loading, pagination, filters, loadProducts, updateFilters } =
    useProducts();

  const [searchText, setSearchText] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadSearchHistory();
    inputRef.current?.focus();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const history = await getSearchHistory();
      setSearchHistory(history);
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (text.trim() === '') {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const mergedFilters = { ...filters, search: text, page: 1 };
        updateFilters(mergedFilters);
        await loadProducts(mergedFilters);
        await saveSearchHistory(text);
        await loadSearchHistory();
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const handleHistoryItemPress = (term: string) => {
    setSearchText(term);
    Keyboard.dismiss();
    setIsSearching(true);
    const mergedFilters = { ...filters, search: term, page: 1 };
    updateFilters(mergedFilters);
    loadProducts(mergedFilters);
    setIsSearching(false);
  };

  const handlePopularSearchPress = (term: string) => {
    setSearchText(term);
    Keyboard.dismiss();
    handleSearch(term);
  };

  const handleDeleteHistoryItem = async (term: string) => {
    try {
      await removeSearchHistoryItem(term);
      await loadSearchHistory();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete history item');
    }
  };

  const handleClearHistory = async () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all search history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearSearchHistory();
              await loadSearchHistory();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear history');
            }
          },
        },
      ]
    );
  };

  const handleClearSearch = () => {
    setSearchText('');
    setIsSearching(false);
    const mergedFilters = { ...filters, search: '', page: 1 };
    updateFilters(mergedFilters);
    inputRef.current?.focus();
  };

  const handleLoadMore = () => {
    if (!loading && pagination.currentPage < pagination.totalPages) {
      const nextPage = pagination.currentPage + 1;
      const mergedFilters = { ...filters, search: searchText, page: nextPage };
      loadProducts(mergedFilters);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const mergedFilters = { ...filters, search: searchText, page: 1 };
      await loadProducts(mergedFilters);
    } finally {
      setRefreshing(false);
    }
  };

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const renderSearchHistory = () => {
    if (!isSearching && searchText === '') {
      return (
        <>
          {searchHistory.length > 0 && (
            <View style={styles.historySection}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={handleClearHistory}>
                  <Text style={styles.clearAllButton}>Clear All</Text>
                </TouchableOpacity>
              </View>
              {searchHistory.map((term, index) => (
                <View key={index} style={styles.historyItem}>
                  <TouchableOpacity
                    style={styles.historyItemContent}
                    onPress={() => handleHistoryItemPress(term)}
                  >
                    <Ionicons name="time" size={16} color={theme.colors.textLight} />
                    <Text style={styles.historyItemText}>{term}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteHistoryItem(term)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="close" size={16} color={theme.colors.textLight} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <View style={styles.popularSection}>
            <Text style={styles.popularTitle}>Popular Searches</Text>
            <View style={styles.popularchipsContainer}>
              {POPULAR_SEARCHES.map((term, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.popularChip}
                  onPress={() => handlePopularSearchPress(term)}
                >
                  <Text style={styles.popularChipText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      );
    }

    return null;
  };

  const renderEmptyState = () => {
    if (isSearching || loading) return null;

    if (searchText && products.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🔍</Text>
          <Text style={styles.emptyStateText}>No products found</Text>
          <Text style={styles.emptyStateSubtext}>Try different keywords</Text>
        </View>
      );
    }

    return null;
  };

  const showResults = isSearching === false && searchText !== '';

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={theme.colors.textLight} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Search for ladoos, sweets..."
            placeholderTextColor={theme.colors.textLight}
            value={searchText}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {searchText !== '' && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading Indicator */}
      {isSearching && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}

      {/* Search Results or History/Popular */}
      {showResults && (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridContainer}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => handleProductPress(item.id)}
              variant="grid"
            />
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          scrollIndicatorInsets={{ right: 1 }}
        />
      )}

      {!showResults && !isSearching && renderSearchHistory()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.text,
    paddingVertical: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    paddingHorizontal: 8,
    gap: 8,
  },
  historySection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.text,
  },
  clearAllButton: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.medium as any,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
  },
  historyItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyItemText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.text,
  },
  deleteButton: {
    padding: 8,
  },
  popularSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  popularTitle: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.text,
    marginBottom: 16,
  },
  popularchipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  popularChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
  },
  popularChipText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.background,
    fontWeight: theme.typography.fontWeights.medium as any,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
});
