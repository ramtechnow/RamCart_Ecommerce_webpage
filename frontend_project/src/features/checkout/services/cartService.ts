import { BACKEND_URL } from "../../../config";
import { fetchProducts } from "../../catalog/services/productService";
import { CartItem } from "../types/cartTypes";

// Fetch user's cart from Express backend
export const fetchUserCart = async (userId: string): Promise<CartItem[]> => {
  const token = localStorage.getItem("auth-token");
  if (!token) return [];

  const [productsRes, cartRes] = await Promise.all([
    fetchProducts(),
    fetch(`${BACKEND_URL}/getcart`, {
      method: "GET",
      headers: {
        "auth-token": token,
        "Content-Type": "application/json"
      }
    })
  ]);

  if (!cartRes.ok) throw new Error("Failed to fetch cart");
  const cartData = await cartRes.json(); // Map of key -> { id, size, color, quantity }

  const items: CartItem[] = [];
  for (const key in cartData) {
    const data = cartData[key];
    const product = productsRes.find((p) => p.id === String(data.id));
    if (product) {
      const itemSize = data.size || "M";
      const matchingVariant = (product.variants || []).find((v) => v.size === itemSize);
      const variantPrice = matchingVariant?.price && matchingVariant.price > 0 ? matchingVariant.price : product.newPrice;
      items.push({
        id: key, // Use key as cart item ID
        userId,
        productId: String(data.id),
        name: product.name,
        image: product.image,
        size: itemSize,
        color: data.color || "White",
        quantity: Number(data.quantity || 1),
        price: variantPrice
      });
    }
  }

  return items;
};

// Add or update quantity of item in backend
export const addOrUpdateCartItem = async (
  _userId: string, 
  productId: string, 
  size: string, 
  color: string, 
  qty: number
): Promise<void> => {
  const token = localStorage.getItem("auth-token");
  if (!token) return;

  const res = await fetch(`${BACKEND_URL}/addtocart`, {
    method: "POST",
    headers: {
      "auth-token": token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      itemId: Number(productId) || productId,
      size,
      color,
      qty,
      setQty: false
    })
  });

  if (!res.ok) throw new Error("Failed to add or update cart item");
};

// Update exact quantity in backend
export const updateCartItemQty = async (
  _userId: string,
  productId: string,
  size: string,
  color: string,
  qty: number
): Promise<void> => {
  const token = localStorage.getItem("auth-token");
  if (!token) return;

  const res = await fetch(`${BACKEND_URL}/addtocart`, {
    method: "POST",
    headers: {
      "auth-token": token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      itemId: Number(productId) || productId,
      size,
      color,
      qty,
      setQty: true
    })
  });

  if (!res.ok) throw new Error("Failed to update cart item quantity");
};

// Delete item from backend
export const deleteCartItemDoc = async (
  _userId: string,
  productId: string,
  size: string,
  color: string
): Promise<void> => {
  const token = localStorage.getItem("auth-token");
  if (!token) return;

  const key = `${productId}-${size}-${color}`;
  const res = await fetch(`${BACKEND_URL}/removefromcart`, {
    method: "POST",
    headers: {
      "auth-token": token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      key,
      removeAll: true
    })
  });

  if (!res.ok) throw new Error("Failed to delete cart item");
};

// Clear entire cart for a user in backend
export const clearUserCartDocs = async (_userId: string): Promise<void> => {
  const token = localStorage.getItem("auth-token");
  if (!token) return;

  const res = await fetch(`${BACKEND_URL}/clearcart`, {
    method: "POST",
    headers: {
      "auth-token": token,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) throw new Error("Failed to clear cart");
};

// Merge guest local cart with user database cart on sign in
export const mergeGuestCart = async (userId: string, localItems: CartItem[]): Promise<void> => {
  for (const item of localItems) {
    await addOrUpdateCartItem(userId, item.productId, item.size, item.color, item.quantity);
  }
};

