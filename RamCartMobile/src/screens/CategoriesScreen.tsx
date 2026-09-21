import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { apiService, MobileProduct } from '../services/api';
import { COLORS, SPACING } from '../utils/constants';

interface CategoryItem {
  id: string;
  name: string;
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const CATEGORIES_LIST: CategoryItem[] = [
  { id: '1', name: "Women's Collection", key: 'women', icon: 'woman-outline' },
  { id: '2', name: "Men's Collection", key: 'men', icon: 'man-outline' },
  { id: '3', name: "Kids & Baby", key: 'kid', icon: 'happy-outline' },
];

export const CategoriesScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('women');
  const [products, setProducts] = useState<MobileProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadCategoryProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.fetchProducts();
      if (res.success && Array.isArray(res.data)) {
        setProducts(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch category products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCategoryProducts();
  }, [loadCategoryProducts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCategoryProducts();
  }, [loadCategoryProducts]);

  const filteredProducts = products.filter(
    (p) => p.category?.toLowerCase() === selectedCategory.toLowerCase()
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Shop Categories" />

      {/* Top Category Selectors */}
      <View style={styles.tabBar}>
        {CATEGORIES_LIST.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          const count = products.filter(
            (p) => p.category?.toLowerCase() === cat.key.toLowerCase()
          ).length;

          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.tabItem, isSelected && styles.tabItemActive]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <Ionicons
                name={cat.icon}
                size={20}
                color={isSelected ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                {cat.name.split("'")[0]} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Product List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading category items...</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={56} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>No items in this category</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <View style={styles.imageContainer}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.productImage} />
                ) : (
                  <Ionicons name="image-outline" size={32} color={COLORS.textLight} />
                )}
              </View>
              <View style={styles.infoContainer}>
                <Text style={styles.categoryBadge}>{item.category}</Text>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceText}>₹{item.new_price}</Text>
                  {item.old_price > item.new_price && (
                    <Text style={styles.oldPriceText}>₹{item.old_price}</Text>
                  )}
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.xs,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  listContainer: {
    padding: SPACING.md,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageContainer: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  categoryBadge: {
    fontSize: 10,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: 6,
  },
  oldPriceText: {
    fontSize: 12,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
});
