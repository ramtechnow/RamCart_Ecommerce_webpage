import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { apiService, MobileProduct, MobileBanner } from '../services/api';
import { COLORS, SPACING } from '../utils/constants';

interface AdminOrder {
  _id: string;
  orderId?: string;
  userEmail?: string;
  userName?: string;
  status: string;
  amount?: number;
  totalAmount?: number;
  createdAt?: string;
  date?: string;
  items?: any[];
}

export const AdminDashboardScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'banners' | 'orders'>('overview');
  const [products, setProducts] = useState<MobileProduct[]>([]);
  const [banners, setBanners] = useState<MobileBanner[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, bannerRes, orderRes] = await Promise.all([
        apiService.fetchProducts(),
        apiService.fetchBanners('home'),
        apiService.fetchAllOrders(),
      ]);

      if (prodRes.success && Array.isArray(prodRes.data)) {
        setProducts(prodRes.data);
      }

      if (bannerRes.success && Array.isArray(bannerRes.data)) {
        setBanners(bannerRes.data);
      }

      if (orderRes.success && Array.isArray(orderRes.data)) {
        setOrders(orderRes.data);
      } else if (Array.isArray(orderRes)) {
        setOrders(orderRes as unknown as AdminOrder[]);
      }
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAdminData();
  }, [loadAdminData]);

  const handleUpdateOrderStatus = async (orderId: string, currentStatus: string) => {
    const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];

    Alert.alert(
      'Update Order Status',
      `Change order status from ${currentStatus} to ${nextStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Set to ${nextStatus}`,
          onPress: async () => {
            const res = await apiService.updateOrderStatus(orderId, nextStatus);
            if (res.success) {
              setOrders((prev) =>
                prev.map((o) => (o._id === orderId ? { ...o, status: nextStatus } : o))
              );
              Alert.alert('Status Updated', `Order set to ${nextStatus}`);
            } else {
              Alert.alert('Update Failed', res.error || 'Could not update order status');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="👑 Admin Control Dashboard"
        showBack
        onBackPress={() => (navigation?.canGoBack() ? navigation.goBack() : null)}
      />

      {/* Admin Quick Tabs */}
      <View style={styles.tabContainer}>
        {[
          { key: 'overview', label: 'Overview', icon: 'grid-outline' as const },
          { key: 'products', label: `Products (${products.length})`, icon: 'cube-outline' as const },
          { key: 'banners', label: `Banners (${banners.length})`, icon: 'images-outline' as const },
          { key: 'orders', label: `Orders (${orders.length})`, icon: 'receipt-outline' as const },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={isActive ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Syncing Admin Control Panel...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        >
          {activeTab === 'overview' && (
            <View>
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="cube" size={28} color="#2563eb" />
                  <Text style={styles.statNumber}>{products.length}</Text>
                  <Text style={styles.statLabel}>Total Products</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="receipt" size={28} color="#16a34a" />
                  <Text style={styles.statNumber}>{orders.length}</Text>
                  <Text style={styles.statLabel}>Total Orders</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: '#faf5ff' }]}>
                  <Ionicons name="images" size={28} color="#9333ea" />
                  <Text style={styles.statNumber}>{banners.length}</Text>
                  <Text style={styles.statLabel}>Active Banners</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: '#fff7ed' }]}>
                  <Ionicons name="shield-checkmark" size={28} color="#ea580c" />
                  <Text style={styles.statNumber}>ACTIVE</Text>
                  <Text style={styles.statLabel}>Admin Role</Text>
                </View>
              </View>

              {/* Quick Actions Card */}
              <View style={styles.sectionBox}>
                <Text style={styles.sectionHeaderTitle}>Admin Operational Management</Text>
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => setActiveTab('products')}
                >
                  <Ionicons name="cube-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.actionText}>View Live Catalog Products</Text>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => setActiveTab('orders')}
                >
                  <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.actionText}>Manage Customer Orders & Delivery Status</Text>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => setActiveTab('banners')}
                >
                  <Ionicons name="images-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.actionText}>View Active Promotional Banners</Text>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {activeTab === 'products' && (
            <View>
              <Text style={styles.sectionHeaderTitle}>Live Catalog Items ({products.length})</Text>
              {products.map((item) => (
                <View key={item.id} style={styles.itemRowCard}>
                  <Image source={{ uri: item.image }} style={styles.rowImage} resizeMode="cover" />
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.rowSubtitle}>
                      Category: {item.category} | ID: #{item.id}
                    </Text>
                    <Text style={styles.rowPrice}>₹{item.new_price}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'banners' && (
            <View>
              <Text style={styles.sectionHeaderTitle}>Active Store Banners ({banners.length})</Text>
              {banners.length === 0 ? (
                <Text style={styles.emptyText}>No hero banners returned from backend API.</Text>
              ) : (
                banners.map((b) => (
                  <View key={b._id} style={styles.bannerRowCard}>
                    <Ionicons name="megaphone-outline" size={24} color={COLORS.primary} />
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowTitle}>{b.description || 'Promotional Banner'}</Text>
                      <Text style={styles.rowSubtitle}>
                        Page Target: {b.page || 'Home'} | Discount: {b.discountValue || 50}%
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'orders' && (
            <View>
              <Text style={styles.sectionHeaderTitle}>Customer Orders Dashboard ({orders.length})</Text>
              {orders.length === 0 ? (
                <Text style={styles.emptyText}>No customer orders recorded in backend yet.</Text>
              ) : (
                orders.map((o) => (
                  <TouchableOpacity
                    key={o._id}
                    style={styles.orderCard}
                    onPress={() => handleUpdateOrderStatus(o._id, o.status)}
                  >
                    <View style={styles.orderTop}>
                      <View>
                        <Text style={styles.orderId}>
                          Order #{o.orderId || o._id.substring(0, 8)}
                        </Text>
                        <Text style={styles.orderEmail}>{o.userEmail || o.userName || 'Customer'}</Text>
                      </View>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{o.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.orderAmount}>
                      Total: ₹{o.amount || o.totalAmount || 0}
                    </Text>
                    <Text style={styles.tapToUpdate}>Tap to update order delivery status</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.xs,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: COLORS.primary,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '800',
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
  scrollContent: {
    padding: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  statCard: {
    width: '48%',
    padding: SPACING.md,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.xs,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
  itemRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.xs + 2,
    marginBottom: SPACING.xs + 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  rowInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  rowSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rowPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2,
  },
  bannerRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  orderEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  orderAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  tapToUpdate: {
    fontSize: 11,
    color: COLORS.textLight,
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginVertical: SPACING.md,
  },
});
