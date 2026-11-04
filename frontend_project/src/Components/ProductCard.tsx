/* ============================================================
   ProductCard.tsx — RAMCART Clean Modern Commerce Card
   Truthful data representation, responsive, zero fake metrics.
   ============================================================ */
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Star, ShoppingBag, Zap, Share2 } from "lucide-react";
import { useWishlist } from "../features/catalog/hooks/useWishlist";
import { useCart } from "../features/checkout/hooks/useCart";
import { useAppDispatch } from "../store/hooks";
import { addToast } from "../store/slices/toastSlice";
import { Product } from "../features/catalog/types/productTypes";
import "../Styles/productGrid.css";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const isWishlisted = isInWishlist(product.id);

  // Compute primary image source with HTTPS safety
  const rawImg = product.image || (product.images && product.images[0]) || "";
  const initialImg = rawImg.replace(/^http:\/\/frontend-project-jucn\.onrender\.com/, "https://frontend-project-jucn.onrender.com");
  
  const [currentImg, setCurrentImg] = useState<string>(initialImg);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const handleImageError = () => {
    // If primary failed, try first item of images array if different
    if (product.images && product.images.length > 0) {
      const altUrl = product.images[0].replace(/^http:\/\/frontend-project-jucn\.onrender\.com/, "https://frontend-project-jucn.onrender.com");
      if (altUrl && altUrl !== currentImg) {
        setCurrentImg(altUrl);
        return;
      }
    }
    setImgError(true);
    setImgLoaded(true);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  // Safe fallback properties — data keys unchanged
  const price = product.newPrice !== undefined ? product.newPrice : (product as any).new_price || 0;
  const oldPrice = product.oldPrice !== undefined ? product.oldPrice : (product as any).old_price;
  
  // Real rating only if present on product
  const ratingVal = (product as any).rating ? Number((product as any).rating) : null;
  const reviewsCount = (product as any).reviewsCount ? Number((product as any).reviewsCount) : null;

  // Calculate discount percentage
  const discountPercent = oldPrice && oldPrice > price
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : 0;

  // Brand label — derive from category
  const brandLabel = product.category
    ? product.category.charAt(0).toUpperCase() + product.category.slice(1).toLowerCase()
    : "RamCart";

  const isOutOfStock = product.stockCount !== undefined && product.stockCount <= 0;
  const showAltName = imgError || !currentImg;

  // ── Quick Add to Cart ────────────────────────────────────────────────────────
  const handleQuickAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || addingToCart) return;

    setAddingToCart(true);
    try {
      await addToCart(product.id, "M", "Default", 1);
      dispatch(addToast({ 
        message: `🛒 Added "${product.name.slice(0, 22)}..." to your cart!`, 
        type: "success" 
      }));
    } catch (err: any) {
      dispatch(addToast({ 
        message: err.message || "Failed to add to cart", 
        type: "error" 
      }));
    } finally {
      setAddingToCart(false);
    }
  };

  // ── 1-Click Buy Now (Direct to Checkout & Razorpay) ──────────────────────────
  const handleQuickBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    navigate(`/checkout?buyNow=true&productId=${product.id}&price=${price}&size=M&qty=1`);
  };

  // ── Share Product (WhatsApp / Native Share / Clipboard) ──────────────────────
  const handleShareProduct = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = `${window.location.origin}/product/${product.id}`;
    const shareText = `Check out ${product.name} for ₹${price} on RamCart!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} | RamCart`,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (err) {
        // Fallback if user dismissed share sheet
      }
    }

    // Clipboard copy fallback
    try {
      await navigator.clipboard.writeText(shareUrl);
      dispatch(addToast({ 
        message: "🔗 Product link copied to clipboard! Share anywhere.", 
        type: "success" 
      }));
    } catch {
      // Direct WhatsApp share URL fallback
      window.open(
        `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
        "_blank"
      );
    }
  };

  return (
    <div className={`product-card ${isOutOfStock ? "is-sold-out" : ""}`} style={{ position: "relative" }}>
      {/* ── Wishlist Heart Button ── */}
      <button
        className={`product-card-wishlist-btn${isWishlisted ? " active" : ""}`}
        onClick={handleWishlistToggle}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        title={isWishlisted ? "In your Wishlist" : "Save to Wishlist"}
        style={{ zIndex: 20 }}
      >
        <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
      </button>

      {/* ── Share Button (WhatsApp / Copy Link) ── */}
      <button
        className="product-card-share-btn"
        onClick={handleShareProduct}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label="Share this Product"
        title="Share on WhatsApp or copy link"
        style={{ zIndex: 20 }}
      >
        <Share2 size={15} />
      </button>

      <Link 
        to={`/product/${product.id}`} 
        style={{ display: "flex", flexDirection: "column", height: "100%", textDecoration: "none", color: "inherit" }}
      >
        {/* ── Image area ── */}
        <div className="product-card-image-wrapper">
          {discountPercent > 0 && !isOutOfStock && (
            <div className="product-card-badge">{discountPercent}% OFF</div>
          )}

          {isOutOfStock && (
            <div className="product-card-soldout-badge">Out of Stock</div>
          )}

          {!imgLoaded && !showAltName && (
            <div className="product-card-image-skeleton" aria-hidden="true" />
          )}

          {showAltName ? (
            /* No image: show styled product name as alt */
            <div style={{
              width: "100%", height: "100%",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              backgroundColor: "var(--bg-secondary)",
              padding: "16px", gap: "8px", textAlign: "center"
            }}>
              <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                {brandLabel}
              </span>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                {product.name}
              </span>
            </div>
          ) : (
            <img
              src={currentImg}
              alt={product.name}
              className="product-card-image"
              loading="lazy"
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              onError={handleImageError}
              style={{
                opacity: imgLoaded ? 1 : 0,
                transition: "opacity 0.3s ease-in-out"
              }}
            />
          )}

          {/* ── Box-Type Quick Actions Overlay (Add to Cart & Buy Now) ── */}
          {!isOutOfStock && (
            <div className="product-card-hover-actions">
              <button
                type="button"
                onClick={handleQuickAddToCart}
                disabled={addingToCart}
                className="product-card-btn-cart"
                title="Add to Shopping Cart"
              >
                <ShoppingBag size={13} />
                <span>{addingToCart ? "Adding..." : "Add to Cart"}</span>
              </button>

              <button
                type="button"
                onClick={handleQuickBuyNow}
                className="product-card-btn-buynow"
                title="Instant Checkout with Razorpay"
              >
                <Zap size={13} />
                <span>Buy Now</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Info panel ── */}
        <div className="product-card-info">
          <span className="product-card-category">{brandLabel}</span>
          <h3 className="product-card-title">{product.name}</h3>

          {ratingVal !== null ? (
            <div className="product-card-rating">
              <span className="product-card-rating-chip">
                <Star size={9} fill="#fff" stroke="none" />
                {ratingVal.toFixed(1)}
              </span>
              {reviewsCount && <span className="product-card-rating-count">({reviewsCount})</span>}
            </div>
          ) : (
            <div className="product-card-tag-row">
              <span className="product-card-edition-tag">RamCart Select</span>
            </div>
          )}

          <div className="product-card-price-row">
            <span className="product-card-new-price">₹{price.toFixed(0)}</span>
            {oldPrice && oldPrice > price && (
              <span className="product-card-old-price">₹{oldPrice.toFixed(0)}</span>
            )}
            {discountPercent > 0 && (
              <span className="product-card-discount-pct">({discountPercent}% OFF)</span>
            )}
          </div>
          <div className="product-card-delivery-hint">
            {price >= 499 ? "✓ Free Delivery" : "Standard Delivery"}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
