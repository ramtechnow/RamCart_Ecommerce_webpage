import { API_CONFIG } from '../utils/config';

export interface ApiResponse<T = any> {
  success: boolean;
  token?: string;
  data?: T;
  message?: string;
  error?: string;
  errors?: string;
  status?: number;
  isNewUser?: boolean;
  user?: {
    name?: string;
    email?: string;
    phone?: string;
    isAdmin?: boolean;
  };
}

export interface MobileProduct {
  id: number;
  name: string;
  category: string;
  image: string;
  new_price: number;
  old_price: number;
  description?: string;
  available?: boolean;
}

export interface MobileBanner {
  _id: string;
  description: string;
  image?: string;
  targetLink?: string;
  discountType?: string;
  discountValue?: number;
  page?: string;
}

class ApiService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  public setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  private getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (this.authToken) {
      headers['auth-token'] = this.authToken;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    if (__DEV__) {
      console.log(`[API Request] ${options.method || 'GET'} ${url}`);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        ...options,
        headers: this.getHeaders(options.headers as Record<string, string>),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData = await response.json();

      if (__DEV__) {
        console.log(`[API Response] ${response.status} ${url}`, responseData);
      }

      if (!response.ok || (responseData && responseData.success === false)) {
        const errorMessage =
          responseData?.errors ||
          responseData?.error ||
          responseData?.message ||
          `HTTP Error ${response.status}`;

        return {
          success: false,
          status: response.status,
          error: errorMessage,
          errors: responseData?.errors,
          data: responseData,
        };
      }

      return {
        success: true,
        status: response.status,
        token: responseData.token,
        isNewUser: responseData.isNewUser,
        user: responseData.user,
        data: Array.isArray(responseData) ? (responseData as unknown as T) : responseData,
        ...responseData,
      };
    } catch (error: any) {
      if (__DEV__) {
        console.warn(`[API Connection Warning] ${options.method || 'GET'} ${url}:`, error.message || error);
      }

      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Connection timed out. Please verify backend server is running.',
        };
      }
      return {
        success: false,
        error:
          error.message ||
          'Failed to connect to backend server. Please check your network.',
      };
    }
  }

  // --- Auth Endpoints ---

  public async login(email: string, password: string): Promise<ApiResponse> {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password }),
    });
  }

  public async signup(username: string, email: string, password: string): Promise<ApiResponse> {
    return this.request('/signup', {
      method: 'POST',
      body: JSON.stringify({
        username: username.trim(),
        email: email.trim(),
        password,
      }),
    });
  }

  public async firebaseSync(email: string, name?: string, uid?: string, phone?: string): Promise<ApiResponse> {
    return this.request('/auth/firebase-sync', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim(),
        name: name ? name.trim() : email.trim().split('@')[0],
        uid,
        phone,
      }),
    });
  }

  // --- Product Catalog Endpoints ---

  public async fetchProducts(): Promise<ApiResponse<MobileProduct[]>> {
    return this.request('/allproducts');
  }

  public async fetchNewCollections(): Promise<ApiResponse<MobileProduct[]>> {
    return this.request('/newcollections');
  }

  public async fetchPopularInWomen(): Promise<ApiResponse<MobileProduct[]>> {
    return this.request('/popularinwomen');
  }

  public async fetchBanners(page = 'home'): Promise<ApiResponse<MobileBanner[]>> {
    return this.request(`/banners/active?page=${page}`);
  }

  // --- Cart & User Endpoints ---

  public async fetchCart(): Promise<ApiResponse<Record<string, number>>> {
    return this.request('/getcart', {
      method: 'GET',
    });
  }

  public async addToCart(itemId: number): Promise<ApiResponse> {
    return this.request('/addtocart', {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    });
  }

  public async removeFromCart(itemId: number): Promise<ApiResponse> {
    return this.request('/removefromcart', {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    });
  }

  // --- Orders & Admin Endpoints ---

  public async fetchUserOrders(): Promise<ApiResponse> {
    return this.request('/userorders', {
      method: 'GET',
    });
  }

  public async fetchAllOrders(): Promise<ApiResponse> {
    return this.request('/admin/orders', {
      method: 'GET',
    });
  }

  public async updateOrderStatus(orderId: string, status: string): Promise<ApiResponse> {
    return this.request('/admin/orders/status', {
      method: 'POST',
      body: JSON.stringify({ orderId, status }),
    });
  }
}

export const apiService = new ApiService();
