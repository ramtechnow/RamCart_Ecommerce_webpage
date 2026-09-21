export const COLORS = {
  primary: '#ff4141',
  primaryDark: '#d32f2f',
  primaryLight: '#ff7961',
  secondary: '#374151',
  background: '#f8f9fa',
  surface: '#ffffff',
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textLight: '#9ca3af',
  border: '#e5e7eb',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  star: '#fbbf24',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '600' as const },
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'ramcart_auth_token',
  USER_DATA: 'ramcart_user_data',
};
