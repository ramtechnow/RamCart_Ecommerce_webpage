import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { CustomButton } from '../components/CustomButton';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING } from '../utils/constants';

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of RamCart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const CUSTOMER_MENU = [
    { id: '1', title: 'My Orders', icon: 'bag-handle-outline' as const, badge: 'Active' },
    { id: '2', title: 'Shipping Address', icon: 'location-outline' as const },
    { id: '3', title: 'Payment Methods', icon: 'card-outline' as const },
    { id: '4', title: 'Wishlist', icon: 'heart-outline' as const },
    { id: '5', title: 'Notifications', icon: 'notifications-outline' as const },
    { id: '6', title: 'Help & Support', icon: 'help-circle-outline' as const },
  ];

  const ADMIN_MENU = [
    { id: 'a1', title: 'Manage Catalog Products', icon: 'cube-outline' as const, badge: 'Admin' },
    { id: 'a2', title: 'Manage Hero Banners', icon: 'images-outline' as const, badge: 'Admin' },
    { id: 'a3', title: 'User Roles & Permissions', icon: 'people-outline' as const, badge: 'Admin' },
    { id: 'a4', title: 'Customer Orders Dashboard', icon: 'receipt-outline' as const, badge: 'Admin' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="My Profile" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={[styles.avatar, user?.isAdmin && styles.adminAvatar]}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{user?.name || 'RamCart User'}</Text>
              {user?.isAdmin && (
                <View style={styles.adminBadgeContainer}>
                  <Text style={styles.adminBadgeText}>ADMIN</Text>
                </View>
              )}
            </View>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          </View>
        </View>

        {/* Admin Section if user is Admin */}
        {user?.isAdmin && (
          <View style={styles.sectionWrapper}>
            <Text style={styles.sectionHeaderTitle}>👑 Admin Control Panel</Text>
            <View style={styles.menuContainer}>
              {ADMIN_MENU.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={() => Alert.alert('Admin Control', `${item.title} dashboard`)}
                >
                  <View style={styles.menuLeft}>
                    <Ionicons name={item.icon} size={22} color={COLORS.primary} />
                    <Text style={styles.menuTitle}>{item.title}</Text>
                  </View>
                  <View style={styles.menuRight}>
                    <Text style={styles.adminTag}>{item.badge}</Text>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Customer Menu Items */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionHeaderTitle}>Account Settings</Text>
          <View style={styles.menuContainer}>
            {CUSTOMER_MENU.map((item) => (
              <TouchableOpacity key={item.id} style={styles.menuItem} activeOpacity={0.7}>
                <View style={styles.menuLeft}>
                  <Ionicons name={item.icon} size={22} color={COLORS.textPrimary} />
                  <Text style={styles.menuTitle}>{item.title}</Text>
                </View>
                <View style={styles.menuRight}>
                  {item.badge && <Text style={styles.badgeText}>{item.badge}</Text>}
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <CustomButton
          title="Sign Out"
          variant="outline"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 16,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  adminAvatar: {
    backgroundColor: '#8b5cf6',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.surface,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  adminBadgeContainer: {
    backgroundColor: '#8b5cf6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  adminBadgeText: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: '800',
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionWrapper: {
    marginBottom: SPACING.md,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  menuContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: SPACING.xs,
  },
  adminTag: {
    fontSize: 11,
    color: '#8b5cf6',
    fontWeight: '700',
    marginRight: SPACING.xs,
  },
  logoutButton: {
    marginTop: SPACING.xs,
  },
});
