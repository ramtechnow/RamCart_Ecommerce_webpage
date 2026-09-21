import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthNavigationProp } from '../navigation/types';
import { COLORS, SPACING } from '../utils/constants';

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<AuthNavigationProp>();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (navigation.isFocused()) {
        navigation.replace('Login');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>R</Text>
        </View>
        <Text style={styles.title}>RamCart</Text>
        <Text style={styles.subtitle}>Your Ultimate Shopping Destination</Text>
      </View>

      <View style={styles.footer}>
        <ActivityIndicator size="large" color={COLORS.surface} />
        <Text style={styles.loadingText}>Loading experience...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xxl,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logoBadgeText: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.primary,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.surface,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: SPACING.xs,
  },
  footer: {
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.surface,
    fontSize: 13,
    marginTop: SPACING.sm,
    opacity: 0.9,
  },
});
