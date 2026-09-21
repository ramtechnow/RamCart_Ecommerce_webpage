import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { CustomButton } from '../components/CustomButton';
import { apiService, MobileProduct } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING } from '../utils/constants';

interface CartItemDetail {
  product: MobileProduct;
  quantity: number;
}

export const CartScreen: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState<CartItemDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadCartData = useCallback(async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [cartRes, prodRes] = await Promise.all([
        apiService.fetchCart(),
        apiService.fetchProducts(),
      ]);

      if (cartRes.success && cartRes.data && prodRes.success && Array.isArray(prodRes.data)) {
        const rawCartMap = cartRes.data;
        const allProducts = prodRes.data;

        const detailedItems: CartItemDetail[] = [];
        Object.entries(rawCartMap).forEach(([itemIdStr, qty]) => {
          const qtyNum = Number(qty);
          if (qtyNum > 0) {
            const matchedProd = allProducts.find((p) => p.id === Number(itemIdStr));
            if (matchedProd) {
              detailedItems.push({
                product: matchedProd,
                quantity: qtyNum,
              });
            }
          }
        });

        setCartItems(detailedItems);
      }
    } catch (error) {
      console.error('Failed to fetch cart data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadCartData();
  }, [loadCartData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCartData();
  }, [loadCartData]);

  const handleAddToCart = async (productId: number) => {
    setUpdatingId(productId);
    try {
      const res = await apiService.addToCart(productId);
      if (res.success) {
        await loadCartData();
      }
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveFromCart = async (productId: number) => {
    setUpdatingId(productId);
    try {
      const res = await apiService.removeFromCart(productId);
      if (res.success) {
        await loadCartData();
      }
    } catch (err) {
      console.error('Failed to remove from cart:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + item.product.new_price * item.quantity, 0);
  };

  const subtotal = calculateSubtotal();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Shopping Cart" />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Syncing your cart...</Text>
        </View>
      ) : !isAuthenticated ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed-outline" size={70} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>Sign in to view your cart</Text>
          <Text style={styles.emptySubtitle}>Your saved cart items will appear once you log in.</Text>
        </View>
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Explore our catalog and add your favorite items!</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.cartContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        >
          <View style={styles.cartHeaderInfo}>
            <Text style={styles.itemCountText}>Cart Items ({cartItems.length})</Text>
          </View>

          {cartItems.map((item) => (
            <View key={item.product.id} style={styles.cartItem}>
              <View style={styles.itemImageContainer}>
                {item.product.image ? (
                  <Image source={{ uri: item.product.image }} style={styles.itemImage} />
                ) : (
                  <Ionicons name="shirt-outline" size={28} color={COLORS.textSecondary} />
                )}
              </View>

              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.product.name}
                </Text>
                <Text style={styles.itemCategory}>Category: {item.product.category}</Text>
                <Text style={styles.itemPrice}>₹{item.product.new_price}</Text>
              </View>

              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={() => handleRemoveFromCart(item.product.id)}
                  disabled={updatingId === item.product.id}
                >
                  <Text style={styles.qtyText}>-</Text>
                </TouchableOpacity>

                <Text style={styles.qtyValue}>{item.quantity}</Text>

                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={() => handleAddToCart(item.product.id)}
                  disabled={updatingId === item.product.id}
                >
                  <Text style={styles.qtyText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Order Summary */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{subtotal}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.freeText}>FREE</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{subtotal}</Text>
            </View>
          </View>

          <CustomButton title="Proceed to Checkout" style={styles.checkoutButton} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  cartContent: {
    padding: SPACING.md,
  },
  cartHeaderInfo: {
    marginBottom: SPACING.sm,
  },
  itemCountText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  itemCategory: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  qtyButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 6,
  },
  summaryContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  freeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    marginTop: SPACING.sm,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  checkoutButton: {
    marginTop: SPACING.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
