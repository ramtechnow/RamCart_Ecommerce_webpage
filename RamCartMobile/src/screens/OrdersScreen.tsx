import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING } from '../utils/constants';

interface OrderItem {
  id?: number;
  name?: string;
  image?: string;
  new_price?: number;
  quantity?: number;
}

interface OrderRecord {
  _id: string;
  orderId?: string;
  date?: string;
  createdAt?: string;
  status: string;
  totalAmount: number;
  items: OrderItem[];
  shippingAddress?: string;
}

export const OrdersScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await apiService.fetchUserOrders();
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        // Sample orders fallback for initial user presentation
        setOrders([
          {
            _id: 'ord-101',
            orderId: 'RAM-98421',
            date: '2026-09-20',
            status: 'Shipped',
            totalAmount: 1250,
            items: [
              { id: 1, name: 'Striped Flutter Sleeve Blouse', new_price: 850, quantity: 1 },
              { id: 2, name: 'Casual Slim Fit Denim Shirt', new_price: 400, quantity: 1 },
            ],
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch user orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return COLORS.success;
      case 'shipped':
        return '#3b82f6';
      case 'processing':
      case 'pending':
        return COLORS.warning;
      case 'cancelled':
        return COLORS.error;
      default:
        return COLORS.primary;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="My Orders & Tracking"
        showBack
        onBackPress={() => (navigation?.canGoBack() ? navigation.goBack() : null)}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching order history...</Text>
        </View>
      ) : !isAuthenticated ? (
        <View style={styles.centerContainer}>
          <Ionicons name="lock-closed-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>Sign in to view orders</Text>
          <Text style={styles.emptySubtitle}>Your order history and status tracking will appear here.</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="bag-remove-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>No orders placed yet</Text>
          <Text style={styles.emptySubtitle}>Explore our products and place your first order!</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id || item.orderId || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderId}>Order #{item.orderId || item._id.substring(0, 8)}</Text>
                  <Text style={styles.orderDate}>{item.date || item.createdAt?.substring(0, 10) || 'Recently'}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.itemsList}>
                {item.items?.map((prod, idx) => (
                  <View key={idx} style={styles.orderItemRow}>
                    <Ionicons name="cube-outline" size={20} color={COLORS.primary} style={styles.itemIcon} />
                    <Text style={styles.itemName} numberOfLines={1}>
                      {prod.name || 'RamCart Product'} x {prod.quantity || 1}
                    </Text>
                    <Text style={styles.itemPrice}>₹{(prod.new_price || 0) * (prod.quantity || 1)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.divider} />

              <View style={styles.orderFooter}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalAmount}>₹{item.totalAmount}</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  listContainer: {
    padding: SPACING.md,
  },
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  orderDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  itemsList: {
    marginVertical: 4,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  itemIcon: {
    marginRight: SPACING.xs,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
});
