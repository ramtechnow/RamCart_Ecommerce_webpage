export interface ProductVariant {
  sku?: string;
  size: string;
  color: string;
  stock: number;
  price?: number;
  oldPrice?: number;
  old_price?: number;
}

export interface Product {
  id: string; // Document ID (e.g. "prod_123" or Firestore ID)
  name: string;
  description: string;
  category: string; // "men" | "women" | "kid"
  newPrice: number;
  oldPrice: number;
  sizes: string[];
  colors: string[];
  variants: ProductVariant[];
  stockCount: number;
  image: string; // Primary image URL
  images?: string[]; // Multiple image URLs list
  available: boolean;
  createdAt: any;
}
