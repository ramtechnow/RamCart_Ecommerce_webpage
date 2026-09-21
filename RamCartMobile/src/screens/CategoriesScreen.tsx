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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { apiService, MobileProduct } from '../services/api';
import { COLORS, SPACING } from '../utils/constants';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.md * 3) / 2;

interface CategoryItem {
  id: string;
  name: string;
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const CATEGORIES_LIST: CategoryItem[] = [
  { id: '1', name: "Women's", key: 'women', icon: 'woman-outline' },
  { id: '2', name: "Men's", key: 'men', icon: 'man-outline' },
  { id: '3', name: "Kids & Baby", key: 'kid', icon: 'happy-outline' },
];

const matchesCategory = (productCategory?: string, targetKey?: string): boolean => {
  if (!productCategory || !targetKey) return false;
  const cat = productCategory.toLowerCase().trim();
  const key = targetKey.toLowerCase().trim();

  if (cat === key) return true;
  if (key === 'kid' && (cat === 'kids' || cat.includes('kid') || cat.includes('child'))) return true;
  if (key === 'women' && (cat === 'womens' || cat.includes('women'))) return true;
  if (key === 'men' && (cat === 'mens' || cat === 'men')) return true;
  return cat.startsWith(key);
};

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

  const filteredProducts = products.filter((p) =>
    matchesCategory(p.category, selectedCategory)
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Shop Categories" />

      {/* Category Selection Tabs */}
      <View style={styles.tabBar}>
        {CATEGORIES_LIST.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          const count = products.filter((p) => matchesCategory(p.category, cat.key)).length;

          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.tabItem, isSelected && styles.tabItemActive]}
              onPress={() => setSelectedCategory(cat.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={cat.icon}
                size={18}
                color={isSelected ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                {cat.name} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Grid Product Display */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading category products...</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={56} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>No products found in this category</Text>
          <Text style={styles.emptySubtitle}>Try selecting a different category above.</Text>
        </View>
      ) : (
        <FlatList
          key={selectedCategory}
          data={filteredProducts}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          renderItem={({ item }) => (
            <View style={styles.productCard}>
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
                <View style={styles.categoryBadgeContainer}>
                  <Text style={styles.categoryBadge}>{item.category}</Text>
                </View>
              </View>

              <View style={styles.infoContainer}>
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
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
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
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  listContainer: {
    padding: SPACING.md,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 1.05,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadge: {
    fontSize: 9,
    color: COLORS.surface,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  infoContainer: {
    padding: SPACING.sm,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    height: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    marginRight: 6,
  },
  oldPriceText: {
    fontSize: 12,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
});
