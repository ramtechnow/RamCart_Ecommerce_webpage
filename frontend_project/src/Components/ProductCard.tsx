/* ============================================================
   ProductCard.tsx — Myntra-inspired card component
   No backend/data logic modified.
   ============================================================ */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Star } from "lucide-react";
import { useWishlist } from "../features/catalog/hooks/useWishlist";
import { Product } from "../features/catalog/types/productTypes";
import "../Styles/productGrid.css";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  // Safe fallback properties — data keys unchanged
  const price = product.newPrice !== undefined ? product.newPrice : (product as any).new_price || 0;
  const oldPrice = product.oldPrice !== undefined ? product.oldPrice : (product as any).old_price;
  const ratingVal = (product as any).rating || 4.5;
  const reviewsCount = (product as any).reviewsCount || 88;

  // Calculate discount percentage
  const discountPercent = oldPrice && oldPrice > price
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : 0;

  // Brand label — derive from category
  const brandLabel = product.category
    ? product.category.charAt(0).toUpperCase() + product.category.slice(1).toLowerCase()
    : "RamCart";

  // Show styled name-alt instead of broken image
  const showAltName = imgError || !product.image;

  return (
    <div className="product-card" style={{ position: "relative" }}>
      <button
        className={`product-card-wishlist-btn${isWishlisted ? " active" : ""}`}
        onClick={handleWishlistToggle}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        style={{ zIndex: 20 }}
      >
        <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
      </button>

      <Link to={`/product/${product.id}`} style={{ display: "flex", flexDirection: "column", height: "100%", textDecoration: "none", color: "inherit" }}>
        {/* ── Image area ── */}
        <div className="product-card-image-wrapper">
          {discountPercent > 0 && (
            <div className="product-card-badge">{discountPercent}% OFF</div>
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
              src={product.image}
              alt={product.name}
              className="product-card-image"
              loading="lazy"
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              onError={() => {
                setImgError(true);
                setImgLoaded(true);
              }}
              style={{
                opacity: imgLoaded ? 1 : 0,
                transition: "opacity 0.3s ease-in-out"
              }}
            />
          )}
        </div>

        {/* ── Info panel ── */}
        <div className="product-card-info">
          <span className="product-card-category">{brandLabel}</span>
          <h3 className="product-card-title">{product.name}</h3>

          <div className="product-card-rating">
            <span className="product-card-rating-chip">
              <Star size={9} fill="#fff" stroke="none" />
              {ratingVal.toFixed(1)}
            </span>
            <span className="product-card-rating-count">| {reviewsCount}</span>
          </div>

          <div className="product-card-price-row">
            <span className="product-card-new-price">₹{price.toFixed(0)}</span>
            {oldPrice && <span className="product-card-old-price">₹{oldPrice.toFixed(0)}</span>}
            {discountPercent > 0 && <span className="product-card-discount-pct">({discountPercent}% OFF)</span>}
          </div>
          <div className="product-card-free-delivery">🚚 Free Delivery</div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
