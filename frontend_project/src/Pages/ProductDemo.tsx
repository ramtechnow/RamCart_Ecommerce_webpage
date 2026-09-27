import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProducts } from "src/features/catalog/services/productService";
import { Product } from "src/features/catalog/types/productTypes";
import { ProductImageCard } from "src/Components/ui/product-image-card";
import type { ProductImage } from "src/Components/ui/product-image-card";
import { Heart, ShoppingBag, Star, Truck, RotateCcw, Shield, ChevronRight } from "lucide-react";
import { useWishlist } from "src/features/catalog/hooks/useWishlist";
import { useCart } from "src/features/checkout/hooks/useCart";

export default function ProductDemo() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [added, setAdded] = useState(false);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts().then((products) => {
      if (products.length > 0) {
        setProduct(products[0]);
        if (products[0].sizes?.length > 0) {
          setSelectedSize(products[0].sizes[0]);
        }
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 44, height: 44, border: "4px solid var(--border-color)", borderTop: "4px solid var(--accent-pink)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading product…</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No products found. Check your backend connection.</p>
          <button onClick={() => navigate("/catalog")} style={{ marginTop: 16, background: "var(--accent-pink)", color: "#fff", padding: "10px 24px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            Browse Catalog
          </button>
        </div>
      </div>
    );
  }

  // Build image list: primary + extras from product.images
  const imageList: ProductImage[] = [
    { src: product.image, alt: product.name },
    ...(product.images || [])
      .filter((img) => img && img !== product.image)
      .map((img) => ({ src: img, alt: product.name })),
  ].filter((img) => Boolean(img.src));

  // If only one image, show it twice so carousel is not empty
  if (imageList.length === 1) {
    imageList.push({ src: product.image, alt: `${product.name} — detail` });
  }

  const price = product.newPrice;
  const oldPrice = product.oldPrice;
  const discountPercent = oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = async () => {
    await addToCart(product.id, selectedSize || "M", "White", 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <main style={{ paddingBottom: 80, paddingTop: 16 }}>
      {/* Breadcrumb */}
      <div className="container" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
        <span
          style={{ cursor: "pointer", textDecoration: "underline" }}
          onClick={() => navigate("/")}
        >Home</span>
        <ChevronRight size={12} />
        <span
          style={{ cursor: "pointer", textDecoration: "underline" }}
          onClick={() => navigate("/catalog")}
        >Catalog</span>
        <ChevronRight size={12} />
        <span style={{ color: "var(--text-secondary)" }}>{product.name}</span>
      </div>

      <div className="container" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start" }}>
        {/* LEFT — Image gallery (21st.dev ProductImageCard) */}
        <div>
          <ProductImageCard
            title={product.name}
            images={imageList}
            initialIndex={0}
            className="border-border"
          />
        </div>

        {/* RIGHT — Product Info Panel */}
        <div style={{ paddingTop: 8, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Category + Name */}
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-pink)", letterSpacing: 2, textTransform: "uppercase" }}>
              {product.category}
            </span>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.25, marginTop: 6 }}>
              {product.name}
            </h1>
          </div>

          {/* Rating */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "var(--rating-green)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "3px 7px", borderRadius: 4 }}>
              <Star size={10} fill="#fff" stroke="none" />
              4.5
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>| 2,847 Ratings & 486 Reviews</span>
          </div>

          {/* Price */}
          <div style={{ borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", padding: "16px 0" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>
                ₹{price.toFixed(0)}
              </span>
              {oldPrice > 0 && (
                <span style={{ fontSize: 16, color: "var(--text-muted)", textDecoration: "line-through" }}>
                  ₹{oldPrice.toFixed(0)}
                </span>
              )}
              {discountPercent > 0 && (
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-pink)" }}>
                  {discountPercent}% OFF
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Inclusive of all taxes</p>
          </div>

          {/* Offers */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>Available Offers</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: "🏦", text: "10% Off on HDFC Bank Credit Card, up to ₹500" },
                { icon: "🎁", text: "Get ₹100 Cashback on first RamCart Pay transaction" },
                { icon: "🛒", text: "Buy 2 Get 1 Free on select items" },
              ].map((offer, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "var(--text-secondary)" }}>
                  <span style={{ fontSize: 14 }}>{offer.icon}</span>
                  <span>{offer.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Size Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Select Size</h4>
                <button style={{ fontSize: 12, color: "var(--accent-pink)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Size Guide</button>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    style={{
                      width: 44, height: 44, borderRadius: "50%", border: selectedSize === size ? "2px solid var(--text-primary)" : "1px solid var(--border-color)",
                      background: selectedSize === size ? "var(--text-primary)" : "transparent",
                      color: selectedSize === size ? "var(--bg-primary)" : "var(--text-primary)",
                      fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s"
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CTAs */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleAddToCart}
              style={{
                flex: 1, height: 42, background: added ? "var(--rating-green)" : "var(--accent-pink)", color: "#fff", border: "none", borderRadius: 8,
                fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s"
              }}
            >
              <ShoppingBag size={16} />
              {added ? "Added to Cart ✓" : "Add to Cart"}
            </button>
            <button
              onClick={() => toggleWishlist(product.id)}
              style={{
                width: 42, height: 42, border: isWishlisted ? "2px solid var(--accent-pink)" : "1px solid var(--border-color)", borderRadius: 8,
                background: isWishlisted ? "var(--accent-light)" : "transparent", color: isWishlisted ? "var(--accent-pink)" : "var(--text-muted)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s"
              }}
            >
              <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Delivery & Trust */}
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: <Truck size={16} />, label: "Free Delivery", desc: "Delivered by Tomorrow if ordered within 3 hrs" },
              { icon: <RotateCcw size={16} />, label: "Easy 30-Day Returns", desc: "Easy return & exchange at your doorstep" },
              { icon: <Shield size={16} />, label: "100% Authentic", desc: "Genuine products sourced directly from brands" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ color: "var(--accent-pink)", marginTop: 2, flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{item.label}</span>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Product Description</h4>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile layout override */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .product-demo-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
