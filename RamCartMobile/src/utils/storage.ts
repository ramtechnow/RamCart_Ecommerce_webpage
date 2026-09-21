import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Sanitize key to ensure compliance with Expo SecureStore requirements:
 * Keys must not be empty and contain only alphanumeric characters, ".", "-", and "_".
 */
const sanitizeKey = (key: string): string => {
  return key.replace(/[^a-zA-Z0-9.\-_]/g, '_');
};

/**
 * Storage utility wrapping expo-secure-store for native platforms
 * with fallback for web / non-native environments.
 */
export const storage = {
  async setItem(key: string, value: string): Promise<void> {
    const validKey = sanitizeKey(key);
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(validKey, value);
        }
      } else {
        await SecureStore.setItemAsync(validKey, value);
      }
    } catch (error) {
      console.error(`Error saving key "${validKey}" to secure storage:`, error);
    }
  },

  async getItem(key: string): Promise<string | null> {
    const validKey = sanitizeKey(key);
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(validKey);
        }
        return null;
      }
      return await SecureStore.getItemAsync(validKey);
    } catch (error) {
      console.error(`Error fetching key "${validKey}" from secure storage:`, error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    const validKey = sanitizeKey(key);
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(validKey);
        }
      } else {
        await SecureStore.deleteItemAsync(validKey);
      }
    } catch (error) {
      console.error(`Error removing key "${validKey}" from secure storage:`, error);
    }
  },
};
