import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_HISTORY_KEY = '@ladoo_search_history';
const MAX_HISTORY_ITEMS = 10;

/**
 * Retrieves search history from AsyncStorage
 * @returns Array of search terms, most recent first
 */
export const getSearchHistory = async (): Promise<string[]> => {
  try {
    const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to get search history:', error);
    return [];
  }
};

/**
 * Saves a search term to history
 * Removes duplicates and limits history to MAX_HISTORY_ITEMS
 * @param searchTerm The search term to save
 */
export const saveSearchHistory = async (searchTerm: string): Promise<void> => {
  try {
    if (!searchTerm.trim()) return;

    let history = await getSearchHistory();

    // Remove duplicate (case-insensitive) if it exists
    history = history.filter((item) => item.toLowerCase() !== searchTerm.toLowerCase());

    // Add new term to beginning
    history.unshift(searchTerm);

    // Limit to MAX_HISTORY_ITEMS
    history = history.slice(0, MAX_HISTORY_ITEMS);

    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save search history:', error);
  }
};

/**
 * Clears all search history
 */
export const clearSearchHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear search history:', error);
  }
};

/**
 * Removes a specific search term from history
 * @param searchTerm The search term to remove
 */
export const removeSearchHistoryItem = async (searchTerm: string): Promise<void> => {
  try {
    let history = await getSearchHistory();
    history = history.filter((item) => item !== searchTerm);
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to remove search history item:', error);
  }
};
