import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { apiService, MobileProduct, MobileBanner } from '../services/api';
import { COLORS, SPACING } from '../utils/constants';

const CATEGORIES = [
  { id: '1', name: 'All', icon: 'grid-outline' as const },
  { id: '2', name: 'Women', icon: 'woman-outline' as const },
  { id: '3', name: 'Men', icon: 'man-outline' as const },
  { id: '4', name: 'Kids', icon: 'happy-outline' as const },
];

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [products, setProducts] = useState<MobileProduct[]>([]);
  const [banners, setBanners] = useState<MobileBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadBackendData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, bannerRes] = await Promise.all([
        apiService.fetchProducts(),
        apiService.fetchBanners('home'),
      ]);

      if (prodRes.success && Array.isArray(prodRes.data)) {
        setProducts(prodRes.data);
      }

      if (bannerRes.success && Array.isArray(bannerRes.data)) {
        setBanners(bannerRes.data);
      }
    } catch (error) {
      console.error('Failed to load products from backend:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBackendData();
  }, [loadBackendData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBackendData();
  }, [loadBackendData]);

  // Filter products by selected category and search query
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      p.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeBanner = banners.length > 0 ? banners[0] : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>Hello, {user?.name || 'Shopper'} 👋</Text>
            <Text style={styles.subGreeting}>Explore real live products from RamCart</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
            <View style={styles.badge} />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search products, brands, categories..."
            placeholderTextColor={COLORS.textLight}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="options-outline" size={20} color={COLORS.surface} />
            </TouchableOpacity>
          )}
        </View>

        {/* Hero Promo Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTag}>
              {activeBanner?.discountType
                ? `${activeBanner.discountValue}% OFF PROMOTION`
                : 'FLAT 50% OFF'}
            </Text>
            <Text style={styles.bannerTitle} numberOfLines={2}>
              {activeBanner?.description || 'NEW SEASON ARRIVALS'}
            </Text>
            <Text style={styles.bannerSubtitle}>Explore latest summer & autumn trends</Text>
            <TouchableOpacity style={styles.shopNowButton}>
              <Text style={styles.shopNowText}>Shop Catalog</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories Horizontal Scroll */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.name)}
              >
                <Ionicons
                  name={cat.icon}
                  size={18}
                  color={isSelected ? COLORS.surface : COLORS.textSecondary}
                />
                <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Featured Products */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Products ({filteredProducts.length})
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Fetching live products from backend...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyProducts}>
            <Ionicons name="cube-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>Try changing your search query or category filter.</Text>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {filteredProducts.map((item) => (
              <View key={item.id} style={styles.productCard}>
                <View style={styles.imageContainer}>
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="image-outline" size={32} color={COLORS.textLight} />
                    </View>
                  )}
                  <TouchableOpacity style={styles.favoriteButton}>
                    <Ionicons name="heart-outline" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.productInfo}>
                  <Text style={styles.productCategory}>{item.category}</Text>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>₹{item.new_price}</Text>
                    {item.old_price > item.new_price && (
                      <Text style={styles.productOldPrice}>₹{item.old_price}</Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subGreeting: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    height: 48,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  filterButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.xs + 2,
    borderRadius: 8,
  },
  heroBanner: {
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    elevation: 3,
  },
  bannerContent: {},
  bannerTag: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bannerTitle: {
    color: COLORS.surface,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  bannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    marginTop: 2,
  },
  shopNowButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: SPACING.md,
  },
  shopNowText: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  categoriesScroll: {
    marginBottom: SPACING.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: 20,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: COLORS.surface,
    fontWeight: '700',
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  emptyProducts: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: SPACING.xl,
  },
  productCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 140,
    backgroundColor: '#f3f4f6',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 6,
    elevation: 2,
  },
  productInfo: {
    padding: SPACING.sm,
  },
  productCategory: {
    fontSize: 10,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginVertical: 2,
    height: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: 6,
  },
  productOldPrice: {
    fontSize: 12,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
});
