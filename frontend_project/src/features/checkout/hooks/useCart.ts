import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { 
  setCartItems, 
  addLocalItem, 
  updateLocalQuantity, 
  removeLocalItem, 
  clearLocalCart, 
  setCartLoading 
} from "../../../store/slices/cartSlice";
import { addToast } from "../../../store/slices/toastSlice";
import { 
  fetchUserCart, 
  addOrUpdateCartItem, 
  updateCartItemQty, 
  deleteCartItemDoc, 
  clearUserCartDocs,
  mergeGuestCart
} from "../services/cartService";
import { CartItem } from "../types/cartTypes";
import { fetchProductById } from "../../catalog/services/productService";

export const useCart = () => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cart.items);
  const cartLoading = useAppSelector((state) => state.cart.loading);
  const { user } = useAppSelector((state) => state.auth);

  // Sync cart from Firestore when user changes
  const syncCart = useCallback(async () => {
    if (!user) {
      // Load guest cart from localStorage
      const localCart = localStorage.getItem("guest-cart");
      if (localCart) {
        try {
          dispatch(setCartItems(JSON.parse(localCart)));
        } catch (e) {
          console.error("Failed to parse guest cart:", e);
        }
      }
      return;
    }

    dispatch(setCartLoading(true));
    try {
      // 1. Fetch user's cart from db
      const dbCart = await fetchUserCart(user.uid);
      
      // 2. Check if we have guest items to merge
      const localCart = localStorage.getItem("guest-cart");
      if (localCart) {
        const guestItems: CartItem[] = JSON.parse(localCart);
        if (guestItems.length > 0) {
          await mergeGuestCart(user.uid, guestItems);
          localStorage.removeItem("guest-cart");
          // Re-fetch merged cart
          const mergedCart = await fetchUserCart(user.uid);
          dispatch(setCartItems(mergedCart));
          dispatch(addToast({ message: "Guest cart merged with your account!", type: "success" }));
          return;
        }
      }
      
      dispatch(setCartItems(dbCart));
    } catch (err: any) {
      console.error("Cart sync failed:", err);
    } finally {
      dispatch(setCartLoading(false));
    }
  }, [user, dispatch]);

  useEffect(() => {
    syncCart();
  }, [syncCart]);

  // Persist guest cart to localStorage
  useEffect(() => {
    if (!user) {
      localStorage.setItem("guest-cart", JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  const addToCart = async (productId: string, size = "M", color = "White", quantity = 1, customPrice?: number) => {
    // 1. Fetch product detail to get metadata (name, image, price)
    const product = await fetchProductById(productId);
    if (!product) {
      dispatch(addToast({ message: "Product not found", type: "error" }));
      return;
    }

    const matchingVariant = (product.variants || []).find((v) => v.size === size);
    const variantPrice = matchingVariant?.price && matchingVariant.price > 0 ? matchingVariant.price : product.newPrice;
    const itemPrice = customPrice !== undefined && customPrice > 0 ? customPrice : variantPrice;
    const docId = `${user?.uid || "guest"}_${productId}_${size}_${color}`;
    const cartItem: CartItem = {
      id: docId,
      userId: user?.uid || "guest",
      productId,
      name: product.name,
      image: product.image,
      size,
      color,
      quantity,
      price: itemPrice
    };

    // 2. Update Redux optimistically
    dispatch(addLocalItem(cartItem));
    dispatch(addToast({ message: `${product.name} added to cart!`, type: "success" }));

    // 3. Sync with Firestore if user is authenticated
    if (user) {
      try {
        await addOrUpdateCartItem(user.uid, productId, size, color, quantity);
      } catch (err) {
        console.warn("Failed to sync cart item addition with server:", err);
      }
    }
  };

  const updateQuantity = async (productId: string, size: string, color: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId, size, color);
      return;
    }

    // 1. Update Redux
    dispatch(updateLocalQuantity({ productId, size, color, quantity }));

    // 2. Sync with database
    if (user) {
      try {
        await updateCartItemQty(user.uid, productId, size, color, quantity);
      } catch (err) {
        console.warn("Failed to sync cart quantity update with server:", err);
      }
    }
  };

  const removeFromCart = async (productId: string, size: string, color: string) => {
    // 1. Update Redux
    dispatch(removeLocalItem({ productId, size, color }));
    dispatch(addToast({ message: "Item removed from cart.", type: "info" }));

    // 2. Sync with database
    if (user) {
      try {
        await deleteCartItemDoc(user.uid, productId, size, color);
      } catch (err) {
        console.warn("Failed to sync cart item removal with server:", err);
      }
    }
  };

  const clearCart = async () => {
    dispatch(clearLocalCart());
    if (user) {
      try {
        await clearUserCartDocs(user.uid);
      } catch (err) {
        console.warn("Failed to clear database cart:", err);
      }
    } else {
      localStorage.removeItem("guest-cart");
    }
  };

  // Compute Total items
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Compute Total amount
  const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return {
    cartItems,
    cartLoading,
    cartCount,
    cartTotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    syncCart
  };
};
