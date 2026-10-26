import { adminService } from "../features/admin/services/adminService";

export const adminApi = {
  // Auth Verification
  async verifyAdmin() {
    return adminService.verifyAdmin();
  },

  // Products CRUD
  async fetchProducts() {
    return adminService.fetchProducts();
  },

  async addProduct(productData) {
    await adminService.addProduct(productData);
    return { success: true };
  },

  async updateProduct(productData) {
    await adminService.updateProduct(productData.id, productData);
    return { success: true };
  },

  async removeProduct(id) {
    await adminService.removeProduct(id);
    return { success: true };
  },

  async updateVariantStock(id, color, change) {
    await adminService.updateVariantStock(id, color, change);
    return { success: true };
  },

  // Users Directory
  async fetchUsers() {
    return adminService.fetchUsers();
  },

  async updateUserRole(email, isAdmin) {
    await adminService.updateUserRole(email, isAdmin);
    return { success: true };
  },

  async deleteUser(email) {
    await adminService.deleteUser(email);
    return { success: true };
  },

  // Orders Management
  async fetchOrders() {
    const list = await adminService.fetchOrders();
    return list.map((order) => ({
      ...order,
      _id: order.id,
      date: order.createdAt
    }));
  },

  async updateOrderStatus(orderId, status) {
    await adminService.updateOrderStatus(orderId, status);
    return { success: true };
  },

  async deleteOrder(orderId) {
    await adminService.deleteOrder(orderId);
    return { success: true };
  },

  // Coupons / Promotions
  async fetchCoupons() {
    const coupons = await adminService.fetchCoupons();
    return { success: true, coupons };
  },

  async createCoupon(couponData) {
    await adminService.createCoupon(couponData);
    return { success: true };
  },

  async toggleCoupon(couponId) {
    await adminService.toggleCoupon(couponId);
    return { success: true };
  },

  async deleteCoupon(couponId) {
    await adminService.deleteCoupon(couponId);
    return { success: true };
  },

  // Banners
  async fetchBanners() {
    return adminService.fetchBanners();
  },

  async createBanner(bannerData) {
    await adminService.createBanner(bannerData);
    return { success: true };
  },

  async updateBanner(bannerId, bannerData) {
    await adminService.updateBanner(bannerId, bannerData);
    return { success: true };
  },

  async toggleBanner(bannerId, isActive) {
    await adminService.toggleBanner(bannerId, isActive);
    return { success: true };
  },

  async deleteBanner(bannerId) {
    await adminService.deleteBanner(bannerId);
    return { success: true };
  },

  // Category Showcase Cards
  async fetchCategoryCards() {
    return adminService.fetchCategoryCards();
  },

  async updateCategoryCard(cardData) {
    return adminService.updateCategoryCard(cardData);
  },

  async resetCategoryCards() {
    return adminService.resetCategoryCards();
  }
};
