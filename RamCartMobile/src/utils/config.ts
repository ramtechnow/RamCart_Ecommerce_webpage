import { Platform } from 'react-native';

/**
 * Backend API Configuration for RamCartMobile
 *
 * Defaults to the 24/7 Render Production Cloud Backend (https://frontend-project-jucn.onrender.com).
 * Can be overridden via EXPO_PUBLIC_API_URL environment variable for local backend testing.
 */

const PRODUCTION_CLOUD_BACKEND_URL = 'https://frontend-project-jucn.onrender.com';

const getDevApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Default to 24/7 Render Cloud Backend for seamless mobile device testing without needing local PC server running
  return PRODUCTION_CLOUD_BACKEND_URL;
};

export const API_CONFIG = {
  BASE_URL: getDevApiBaseUrl(),
  TIMEOUT: 15000,
  ENDPOINTS: {
    LOGIN: '/login',
    SIGNUP: '/signup',
    FIREBASE_SYNC: '/auth/firebase-sync',
    ALL_PRODUCTS: '/allproducts',
    NEW_COLLECTIONS: '/newcollections',
    POPULAR_IN_WOMEN: '/popularinwomen',
    ADD_TO_CART: '/addtocart',
    REMOVE_FROM_CART: '/removefromcart',
    GET_CART: '/getcart',
  },
};
