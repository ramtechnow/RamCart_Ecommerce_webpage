import { Platform } from 'react-native';

/**
 * Backend API Configuration
 * 
 * Note for mobile testing:
 * - Android Emulator uses 'http://10.0.2.2:4000' to reach host localhost.
 * - iOS Simulator / Web uses 'http://localhost:4000'.
 * - Physical device testing requires setting EXPO_PUBLIC_API_URL to your local machine IP (e.g., http://192.168.1.5:4000).
 */

const getDevApiBaseUrl = (): string => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000';
  }
  return 'http://localhost:4000';
};

export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || getDevApiBaseUrl(),
  TIMEOUT: 15000,
  ENDPOINTS: {
    LOGIN: '/login',
    SIGNUP: '/signup',
    ALL_PRODUCTS: '/allproducts',
    NEW_COLLECTIONS: '/newcollections',
    POPULAR_IN_WOMEN: '/popularinwomen',
    ADD_TO_CART: '/addtocart',
    REMOVE_FROM_CART: '/removefromcart',
    GET_CART: '/getcart',
  },
};
