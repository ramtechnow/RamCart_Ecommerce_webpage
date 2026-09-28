import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "../features/checkout/hooks/useCart";
import { useWishlist } from "../features/catalog/hooks/useWishlist";
import { fetchProductById, fetchRelatedProducts } from "../features/catalog/services/productService";
import { Product } from "../features/catalog/types/productTypes";
import ProductCard from "../Components/ProductCard";
import { useAppDispatch } from "../store/hooks";
import { addToast } from "../store/slices/toastSlice";
import { 
  Star, Heart, ShoppingCart, ShieldCheck, 
  Truck, RotateCcw, ChevronDown, ChevronUp, X, Ruler, 
  Store, Info, Zap, Tag, Check
} from "lucide-react";
import "../Styles/productDetail.css";

interface SizeTier {
  size: string;
  price: number;
  oldPrice?: number;
  inStock: boolean;
  chest: string;
  length: string;
  shoulder: string;
}

export const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Core State
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState("");
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Selections
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [selectedPrice, setSelectedPrice] = useState<number>(0);
  const [selectedOldPrice, setSelectedOldPrice] = useState<number>(0);
  const [selectedColor, setSelectedColor] = useState<string>("Green");
  const [quantity, setQuantity] = useState<number>(1);
  const [addedNotice, setAddedNotice] = useState(false);
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);
  const [showSizeChartModal, setShowSizeChartModal] = useState(false);

  // Pincode checker
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState<string | null>(null);

  // Load product
  useEffect(() => {
    const loadDetails = async () => {
      if (!productId) return;
      setLoading(true);
      try {
        const prod = await fetchProductById(productId);
        if (prod) {
          setProduct(prod);
          
          const cleanImgs = Array.from(
            new Set(
              [prod.image, ...(prod.images || [])]
                .map((img) => (typeof img === "string" ? img.trim() : ""))
                .filter((img) => img !== "" && img !== "null" && img !== "undefined")
            )
          );
          setActiveImage(cleanImgs[0] || prod.image || "");
          
          if (prod.colors && prod.colors.length > 0) {
            setSelectedColor(prod.colors[0]);
          } else if (prod.variants && prod.variants.length > 0 && prod.variants[0]?.color) {
            setSelectedColor(prod.variants[0].color);
          }
          
          // Load related products
          const related = await fetchRelatedProducts(prod.category, prod.id);
          setRelatedProducts(related);
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error("Failed to load product details:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [productId]);

  // Dynamic Document Title for SEO
  useEffect(() => {
    if (product) {
      document.title = `${product.name} | RamCart`;
    }
  }, [product]);

  // Compute Size Tiers with prices, MSRP old prices and stock status
  const sizeTiers: SizeTier[] = useMemo(() => {
    if (!product) return [];
    const P = product.newPrice || 243;
    const oldP = product.oldPrice || Math.round(P * 1.4);

    // 1. Check if explicit variants with sizes exist in database
    const variantsWithSize = (product.variants || []).filter(
      (v) => v && typeof v.size === "string" && v.size.trim() !== ""
    );
    if (variantsWithSize.length > 0) {
      return variantsWithSize.map((v) => {
        const s = v.size.trim();
        const vPrice = v.price && v.price > 0 ? v.price : P;
        const vOldPrice = (v.old_price && v.old_price > 0) ? v.old_price : ((v.oldPrice && v.oldPrice > 0) ? v.oldPrice : oldP);
        return {
          size: s,
          price: vPrice,
          oldPrice: vOldPrice > vPrice ? vOldPrice : undefined,
          inStock: v.stock === undefined || v.stock > 0,
          chest: s === "S" ? '38"' : s === "M" ? '40"' : s === "L" ? '42"' : '44"',
          length: '29"',
          shoulder: '18"'
        };
      });
    }

    // 2. If product has explicit sizes array
    if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
      return product.sizes.map((s) => {
        const sizeStr = String(s).trim();
        return {
          size: sizeStr,
          price: P,
          oldPrice: oldP > P ? oldP : undefined,
          inStock: product.stockCount === undefined || product.stockCount > 0,
          chest: sizeStr === "S" ? '38"' : sizeStr === "M" ? '40"' : sizeStr === "L" ? '42"' : '44"',
          length: '29"',
          shoulder: '18"'
        };
      });
    }

    // 3. Standard Indian apparel size-tier pricing matching catalog
    return [
      { size: "S", price: Math.max(1, Math.round(P * 0.98)), oldPrice: Math.round(oldP * 0.98), inStock: true, chest: '38"', length: '28"', shoulder: '17.0"' },
      { size: "M", price: P, oldPrice: oldP, inStock: true, chest: '40"', length: '29"', shoulder: '18.0"' },
      { size: "L", price: Math.round(P * 1.04), oldPrice: Math.round(oldP * 1.04), inStock: true, chest: '42"', length: '30"', shoulder: '19.0"' },
      { size: "XL", price: Math.round(P * 1.06), oldPrice: Math.round(oldP * 1.06), inStock: true, chest: '44"', length: '31"', shoulder: '20.0"' },
      { size: "XXL", price: Math.round(P * 1.08), oldPrice: Math.round(oldP * 1.08), inStock: true, chest: '46"', length: '32"', shoulder: '21.0"' }
    ];
  }, [product]);

  // Available colors list from product or its variants
  const availableColors: string[] = useMemo(() => {
    if (!product) return [];
    if (product.colors && Array.isArray(product.colors) && product.colors.length > 0) {
      return product.colors.filter((c): c is string => Boolean(c));
    }
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      const cols = product.variants.map((v) => v.color).filter((c): c is string => Boolean(c));
      if (cols.length > 0) return Array.from(new Set(cols));
    }
    return [];
  }, [product]);

  // Determine whether to display size chart (hide for Free Size / single size items)
  const isFreeSize = useMemo(() => {
    if (!product) return false;
    if (product.variants && product.variants.length === 1 && product.variants[0]?.size) {
      const s = String(product.variants[0].size).toLowerCase().trim();
      if (s.includes("free") || s.includes("one") || s === "fs" || s === "na") return true;
    }
    if (product.sizes && product.sizes.length === 1 && product.sizes[0]) {
      const s = String(product.sizes[0]).toLowerCase().trim();
      if (s.includes("free") || s.includes("one") || s === "fs" || s === "na") return true;
    }
    return false;
  }, [product]);

  const hasSizeChart = !isFreeSize && sizeTiers.length > 1;

  // Initialize selected size & price once tiers are ready
  useEffect(() => {
    if (sizeTiers.length > 0) {
      const defaultTier = sizeTiers.find(t => t.inStock) || sizeTiers[0];
      setSelectedSize(defaultTier.size);
      setSelectedPrice(defaultTier.price);
      setSelectedOldPrice(defaultTier.oldPrice || product?.oldPrice || 0);
    }
  }, [sizeTiers, product]);

  const handleSelectSize = (tier: SizeTier) => {
    if (!tier.inStock) {
      dispatch(addToast({ message: `Size ${tier.size} is currently Out of Stock.`, type: "warning" }));
      return;
    }
    setSelectedSize(tier.size);
    setSelectedPrice(tier.price);
    setSelectedOldPrice(tier.oldPrice || product?.oldPrice || 0);
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product.id, selectedSize, selectedColor, quantity, selectedPrice);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 3000);
  };

  const handleBuyNow = () => {
    if (!product) return;
    navigate(`/checkout?buyNow=true&productId=${product.id}&size=${selectedSize}&color=${selectedColor}&qty=${quantity}&price=${selectedPrice}`);
  };

  const handleCopyHighlights = () => {
    if (!product) return;
    const textToCopy = `Product: ${product.name}\nPrice: ₹${selectedPrice}\nFabric: Cotton Blend\nColor: ${selectedColor}\nFit: Regular Fit\nAvailable at RamCart`;
    navigator.clipboard.writeText(textToCopy);
    dispatch(addToast({ message: "Product details copied to clipboard!", type: "success" }));
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^\d{6}$/.test(pincode.trim())) {
      setPincodeStatus("Estimated delivery in 2-4 business days. Free delivery applied.");
    } else {
      setPincodeStatus("Please enter a valid 6-digit postal code.");
    }
  };

  if (loading) {
    return (
      <main className="rc-pdp-container">
        <div className="rc-pdp-grid">
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "64px" }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="shimmer-line" style={{ width: 64, height: 78, borderRadius: 6, background: "rgba(120,120,120,0.12)" }} />
              ))}
            </div>
            <div className="shimmer-line" style={{ flex: 1, aspectRatio: "4/5", borderRadius: 8, background: "rgba(120,120,120,0.12)" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="shimmer-line" style={{ width: "60%", height: 24, borderRadius: 4, background: "rgba(120,120,120,0.12)" }} />
            <div className="shimmer-line" style={{ width: "35%", height: 32, borderRadius: 4, background: "rgba(120,120,120,0.12)" }} />
            <div className="shimmer-line" style={{ width: "100%", height: 120, borderRadius: 8, background: "rgba(120,120,120,0.08)" }} />
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="rc-pdp-container" style={{ minHeight: "65vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 16px" }}>
        <div style={{
          maxWidth: "540px",
          width: "100%",
          textAlign: "center",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: "24px",
          padding: "48px 24px",
          boxShadow: "0 12px 32px rgba(0,0,0,0.06)"
        }}>
          <div style={{
            width: "68px",
            height: "68px",
            borderRadius: "50%",
            backgroundColor: "rgba(239, 68, 68, 0.12)",
            color: "#ef4444",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px"
          }}>
            <Store size={34} />
          </div>

          <div style={{
            display: "inline-block",
            padding: "4px 14px",
            borderRadius: "999px",
            backgroundColor: "rgba(239, 68, 68, 0.12)",
            color: "#dc2626",
            fontSize: "0.75rem",
            fontWeight: "900",
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            marginBottom: "14px"
          }}>
            404 Error • Product Not Found
          </div>

          <h2 style={{ fontSize: "1.6rem", fontWeight: "900", margin: "0 0 10px 0", color: "var(--text-primary)" }}>
            Product #{productId} Is Unavailable
          </h2>

          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: "1.6", margin: "0 0 28px 0" }}>
            We could not find an active product with ID <strong>#{productId}</strong>. This item may have been discontinued, removed by the store manager, or the URL might contain a typo.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button 
              type="button"
              onClick={() => navigate("/catalog")}
              style={{
                backgroundColor: "var(--accent-color, #ff8906)",
                color: "#ffffff",
                border: "none",
                padding: "12px 28px",
                borderRadius: "999px",
                fontWeight: "800",
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(255, 137, 6, 0.3)"
              }}
            >
              <ShoppingCart size={16} />
              Browse All Products
            </button>

            <button 
              type="button"
              onClick={() => navigate("/")}
              style={{
                backgroundColor: "transparent",
                color: "var(--text-primary)",
                border: "1px solid var(--border-color)",
                padding: "12px 24px",
                borderRadius: "999px",
                fontWeight: "700",
                fontSize: "0.85rem",
                cursor: "pointer"
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Multi-angle images
  const cleanImages = Array.from(
    new Set(
      [product.image, ...(product.images || [])]
        .map(img => (typeof img === "string" ? img.trim() : ""))
        .filter(img => img !== "" && img !== "null" && img !== "undefined")
    )
  );
  const galleryImages = cleanImages.length > 0 ? cleanImages : [product.image || ""];

  // Thumbnail labels
  const viewLabels = ["Front", "Back", "Side", "Detail"];

  // 3 Similar Products
  const similarProducts = relatedProducts.slice(0, 3);

  const isWishlisted = isInWishlist(product.id);
  const isOutOfStock = product.stockCount !== undefined && product.stockCount <= 0;

  return (
    <main className="rc-pdp-container">
      {/* ── Breadcrumb Bar (Matching user specification) ── */}
      <nav aria-label="Breadcrumb" className="rc-pdp-breadcrumb">
        <Link to="/" className="link">Home</Link>
        <span className="separator">/</span>
        <Link to="/catalog" className="link">Catalog</Link>
        <span className="separator">/</span>
        <Link 
          to={product.category === "kids" ? "/kids" : `/${product.category}s`} 
          className="link" 
          style={{ textTransform: "capitalize" }}
        >
          {product.category || "Men"}
        </Link>
        <span className="separator">/</span>
        <span className="link" onClick={() => navigate(`/catalog?search=shirt`)}>
          Top Wear
        </span>
        <span className="separator">/</span>
        <span className="current" title={product.name}>{product.name}</span>
      </nav>

      {/* ── Main Two-Column Layout ── */}
      <div className="rc-pdp-grid">
        {/* ── Left Column: Media Gallery, CTAs & 3 Similar Products ── */}
        <div className="rc-pdp-left-col">
          <div className="rc-pdp-media-wrapper">
            {/* Vertical Thumbnails List on Left */}
            <div className="rc-pdp-thumbnails">
              {galleryImages.map((img, idx) => {
                const isActive = (activeImage || galleryImages[0]) === img;
                const label = viewLabels[idx] || `View ${idx + 1}`;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    className={`rc-pdp-thumb-btn ${isActive ? "active" : ""}`}
                    aria-label={`View ${label} angle`}
                  >
                    <img src={img} alt={`${product.name} ${label}`} className="rc-pdp-thumb-img" />
                    <span className="rc-pdp-thumb-badge">{label}</span>
                  </button>
                );
              })}

              {/* Size Measurement Chart Trigger (Only if multi-size product) */}
              {hasSizeChart && (
                <button
                  type="button"
                  onClick={() => setShowSizeChartModal(true)}
                  className="rc-pdp-thumb-btn rc-pdp-thumb-chart"
                  title="View Size Chart & Measurements"
                  aria-label="View Size Chart"
                >
                  <Ruler size={18} />
                  <span style={{ fontSize: "9px", fontWeight: "800", textTransform: "uppercase" }}>Size Chart</span>
                </button>
              )}
            </div>

            {/* Center Main Large Image Box */}
            <div className="rc-pdp-main-image-box">
              <img 
                src={activeImage || galleryImages[0]} 
                alt={product.name} 
                className="rc-pdp-main-image"
              />

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className={`rc-pdp-wishlist-floating ${isWishlisted ? "active" : ""}`}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
              </button>

              {isOutOfStock && (
                <div className="rc-pdp-out-of-stock-overlay">
                  Out of Stock
                </div>
              )}
            </div>
          </div>

          {/* Action CTA Buttons (Add to Cart / Buy Now) */}
          <div className="rc-pdp-action-buttons">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="rc-pdp-btn-add-cart"
            >
              <ShoppingCart size={18} />
              <span>{addedNotice ? "✓ Added to Cart" : "Add to Cart"}</span>
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="rc-pdp-btn-buy-now"
            >
              <Zap size={18} className="fill-current" />
              <span>Buy Now</span>
            </button>
          </div>

          {/* 3 Similar Products Strip */}
          {similarProducts.length > 0 && (
            <div className="rc-pdp-similar-strip">
              <h4 className="rc-pdp-similar-title">3 Similar Products</h4>
              <div className="rc-pdp-similar-thumbs">
                {similarProducts.map((sim) => (
                  <button
                    key={sim.id}
                    type="button"
                    onClick={() => navigate(`/product/${sim.id}`)}
                    className="rc-pdp-similar-card"
                    title={sim.name}
                  >
                    <img src={sim.image} alt={sim.name} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column: Specs, Size Selection, Highlights, Seller & Reviews ── */}
        <div className="rc-pdp-right-col">
          {/* Header Card: Name, Price, Ratings */}
          <div className="rc-pdp-card">
            <h1 className="rc-pdp-product-title">{product.name}</h1>

            <div className="rc-pdp-price-row" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <span className="rc-pdp-main-price">
                ₹{selectedPrice || product.newPrice}
              </span>
              {selectedOldPrice > (selectedPrice || product.newPrice) && (
                <>
                  <span className="rc-pdp-old-price" style={{ textDecoration: "line-through", color: "var(--text-muted)", fontSize: "1.1rem" }}>
                    ₹{selectedOldPrice}
                  </span>
                  <span className="rc-pdp-discount-badge" style={{ backgroundColor: "#22c55e", color: "white", padding: "2px 8px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "800" }}>
                    {Math.round(((selectedOldPrice - (selectedPrice || product.newPrice)) / selectedOldPrice) * 100)}% OFF
                  </span>
                </>
              )}
              <span className="rc-pdp-price-onwards">onwards</span>
              <span title="Prices vary by size selection" style={{ display: "inline-flex", alignItems: "center", color: "var(--text-muted)", cursor: "help" }}>
                <Info size={14} />
              </span>
            </div>

            <div className="rc-pdp-rating-strip">
              <div className="rc-pdp-rating-badge">
                4.0 <Star size={11} fill="#fff" stroke="none" />
              </div>
              <span className="rc-pdp-rating-count">
                58,160 Ratings, 22,420 Reviews
              </span>
              <span className="rc-pdp-trusted-pill">
                <ShieldCheck size={13} />
                RamCart Trusted
              </span>
            </div>
          </div>

          {/* Color Selection Card (if multiple colors available) */}
          {availableColors.length > 1 && (
            <div className="rc-pdp-card">
              <h3 className="rc-pdp-size-title" style={{ marginBottom: "12px" }}>
                Select Color: <span style={{ color: "var(--accent-pink, #f25f4c)", fontWeight: "800" }}>{selectedColor}</span>
              </h3>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {availableColors.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setSelectedColor(col)}
                    className={`rc-pdp-size-pill ${selectedColor === col ? "active" : ""}`}
                    style={{ padding: "8px 18px", cursor: "pointer" }}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Select Size Card with Individual Prices and Out-of-Stock strike-out */}
          <div className="rc-pdp-card">
            <div className="rc-pdp-size-header">
              <h3 className="rc-pdp-size-title">Select Size</h3>
              {hasSizeChart && (
                <button 
                  type="button" 
                  onClick={() => setShowSizeChartModal(true)}
                  className="rc-pdp-size-chart-link"
                >
                  Size Chart
                </button>
              )}
            </div>

            {/* Size Pills Grid with Size + Individual Price */}
            <div className="rc-pdp-size-pills-grid">
              {sizeTiers.map((tier) => {
                const isSelected = selectedSize === tier.size;
                return (
                  <div
                    key={tier.size}
                    onClick={() => handleSelectSize(tier)}
                    className={`rc-pdp-size-pill ${isSelected ? "active" : ""} ${!tier.inStock ? "out-of-stock" : ""}`}
                    title={!tier.inStock ? `${tier.size} is currently out of stock` : `Select ${tier.size} for ₹${tier.price}`}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      {isSelected && <Check size={13} strokeWidth={3} style={{ color: "#9c27b0" }} />}
                      <span className="size-name">{tier.size}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span className="size-price">₹{tier.price}</span>
                      {tier.oldPrice && tier.oldPrice > tier.price && (
                        <span style={{ textDecoration: "line-through", fontSize: "10px", color: "var(--text-muted)" }}>
                          ₹{tier.oldPrice}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quantity Controller */}
            <div className="rc-pdp-qty-row">
              <span className="rc-pdp-qty-label">Quantity:</span>
              <div className="rc-pdp-qty-control">
                <button
                  type="button"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="rc-pdp-qty-btn"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="rc-pdp-qty-val">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="rc-pdp-qty-btn"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Product Highlights Card */}
          <div className="rc-pdp-card">
            <div className="rc-pdp-highlights-header">
              <h3 className="rc-pdp-highlights-title">Product Highlights</h3>
              <button 
                type="button" 
                onClick={handleCopyHighlights}
                className="rc-pdp-copy-btn"
              >
                COPY
              </button>
            </div>

            <div className="rc-pdp-specs-grid">
              <div className="rc-pdp-spec-item">
                <span className="rc-pdp-spec-label">Fabric</span>
                <span className="rc-pdp-spec-val">Cotton Blend</span>
              </div>
              <div className="rc-pdp-spec-item">
                <span className="rc-pdp-spec-label">Color</span>
                <span className="rc-pdp-spec-val">{selectedColor}</span>
              </div>
              <div className="rc-pdp-spec-item">
                <span className="rc-pdp-spec-label">Pattern</span>
                <span className="rc-pdp-spec-val">Striped</span>
              </div>
              <div className="rc-pdp-spec-item">
                <span className="rc-pdp-spec-label">Fit/Shape</span>
                <span className="rc-pdp-spec-val">Regular</span>
              </div>
            </div>

            {/* Additional Details Accordion */}
            <button
              type="button"
              onClick={() => setShowAdditionalDetails(prev => !prev)}
              className="rc-pdp-details-toggle"
            >
              <span>Additional Details</span>
              {showAdditionalDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showAdditionalDetails && (
              <div className="rc-pdp-details-body">
                <p>• <strong>Collar:</strong> Spread Collar</p>
                <p>• <strong>Sleeve Length:</strong> Long Sleeves with buttoned cuffs</p>
                <p>• <strong>Weave:</strong> Pre-washed breathable cotton weave</p>
                <p>• <strong>Occasion:</strong> Casual, daily wear, weekend outings</p>
                <p>• <strong>Wash Care:</strong> Machine wash cold with similar colors. Do not bleach.</p>
              </div>
            )}
          </div>

          {/* Sold By Card */}
          <div className="rc-pdp-card">
            <div className="rc-pdp-seller-row">
              <div className="rc-pdp-seller-info">
                <div className="rc-pdp-seller-icon">
                  <Store size={22} />
                </div>
                <div>
                  <h4 className="rc-pdp-seller-name">RODIEZ STORE</h4>
                  <div className="rc-pdp-seller-stats">
                    <span className="rc-pdp-seller-badge">4.1 ★</span>
                    <span>42 Products</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/catalog?category=${product.category || "men"}`)}
                className="rc-pdp-btn-view-shop"
              >
                View Shop
              </button>
            </div>
          </div>

          {/* Ratings & Reviews Breakdown Card */}
          <div className="rc-pdp-card">
            <div className="rc-pdp-reviews-header">
              <h3>Product Ratings & Reviews</h3>
            </div>

            <div className="rc-pdp-reviews-breakdown">
              <div className="rc-pdp-rating-big-score">
                <div className="rc-pdp-big-number">
                  4.0 <Star size={24} fill="#22c55e" stroke="none" />
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                  58,160 Ratings<br />22,420 Reviews
                </span>
              </div>

              <div className="rc-pdp-rating-bars">
                {[
                  { star: "5 ★", pct: 55, color: "#22c55e" },
                  { star: "4 ★", pct: 25, color: "#4ade80" },
                  { star: "3 ★", pct: 12, color: "#facc15" },
                  { star: "2 ★", pct: 5, color: "#fb923c" },
                  { star: "1 ★", pct: 3, color: "#f87171" }
                ].map((row) => (
                  <div key={row.star} className="rc-pdp-bar-row">
                    <span style={{ width: "24px" }}>{row.star}</span>
                    <div className="rc-pdp-bar-track">
                      <div className="rc-pdp-bar-fill" style={{ width: `${row.pct}%`, backgroundColor: row.color }} />
                    </div>
                    <span style={{ width: "28px", textAlign: "right", color: "var(--text-muted)" }}>{row.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Customer Review */}
            <div className="rc-pdp-verified-review">
              <div className="rc-pdp-review-author-row">
                <span className="rc-pdp-author-name">Akash Gupta</span>
                <span className="rc-pdp-seller-badge">5.0 ★</span>
                <span className="rc-pdp-review-date">• Verified Purchase</span>
              </div>
              <p className="rc-pdp-review-text">
                "Very nice and beautiful fabric shirt. Quality is premium and fits true to size. Definitely ordering in another color!"
              </p>
            </div>
          </div>

          {/* Trust Strip Card */}
          <div className="rc-pdp-trust-strip">
            <div className="rc-pdp-trust-col">
              <Tag size={20} className="rc-pdp-trust-icon" />
              <span className="rc-pdp-trust-text">Lowest Price</span>
            </div>
            <div className="rc-pdp-trust-col">
              <Truck size={20} className="rc-pdp-trust-icon" />
              <span className="rc-pdp-trust-text">Fast Delivery</span>
            </div>
            <div className="rc-pdp-trust-col">
              <RotateCcw size={20} className="rc-pdp-trust-icon" />
              <span className="rc-pdp-trust-text">7-Day Returns</span>
            </div>
          </div>

          {/* Pincode & Delivery Checker Card */}
          <div className="rc-pdp-card">
            <h4 style={{ fontSize: "13px", fontWeight: "700", margin: "0 0 10px 0" }}>Check Delivery Timeline</h4>
            <form onSubmit={handleCheckPincode} style={{ display: "flex", gap: "8px" }}>
              <input 
                type="text"
                placeholder="Enter 6-digit PIN code"
                value={pincode}
                maxLength={6}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  fontSize: "13px"
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#9c27b0",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "700",
                  fontSize: "12px",
                  cursor: "pointer"
                }}
              >
                Check
              </button>
            </form>
            {pincodeStatus && (
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "8px", margin: "8px 0 0" }}>
                {pincodeStatus}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Size Guide Modal ── */}
      {showSizeChartModal && (
        <div className="rc-pdp-modal-backdrop" onClick={() => setShowSizeChartModal(false)}>
          <div className="rc-pdp-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="rc-pdp-modal-header">
              <h3>Garment Measurement Guide (Inches)</h3>
              <button 
                type="button" 
                onClick={() => setShowSizeChartModal(false)}
                className="rc-pdp-modal-close-btn"
                aria-label="Close size guide"
              >
                <X size={20} />
              </button>
            </div>

            <div className="rc-pdp-modal-body">
              <table className="rc-pdp-size-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Chest (in)</th>
                    <th>Length (in)</th>
                    <th>Shoulder (in)</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeTiers.map((tier) => (
                    <tr 
                      key={tier.size}
                      style={{ 
                        opacity: tier.inStock ? 1 : 0.6,
                        backgroundColor: selectedSize === tier.size ? "rgba(156, 39, 176, 0.08)" : undefined
                      }}
                    >
                      <td><strong>{tier.size}</strong> {!tier.inStock && "(Out of Stock)"}</td>
                      <td>{tier.chest}</td>
                      <td>{tier.length}</td>
                      <td>{tier.shoulder}</td>
                      <td><strong>₹{tier.price}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "14px", lineHeight: "1.5" }}>
                * All dimensions are measured across garments laid flat. If your measurement falls between two sizes, choose the larger size for a relaxed comfortable fit.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── People Also Viewed Section ── */}
      {relatedProducts.length > 0 && (
        <section style={{ marginTop: "64px", borderTop: "1px solid var(--border-color)", paddingTop: "40px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "20px", color: "var(--text-primary)" }}>
            People Also Viewed
          </h2>
          <div className="product-grid">
            {relatedProducts.slice(0, 8).map((simProduct) => (
              <ProductCard key={simProduct.id} product={simProduct} />
            ))}
          </div>
        </section>
      )}

      {/* ── Mobile Sticky Bottom Action Bar ── */}
      <div className="rc-pdp-mobile-sticky-bar">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="rc-pdp-btn-add-cart"
        >
          <ShoppingCart size={16} />
          <span>{addedNotice ? "✓ Added" : "Add to Cart"}</span>
        </button>

        <button
          type="button"
          onClick={handleBuyNow}
          disabled={isOutOfStock}
          className="rc-pdp-btn-buy-now"
        >
          <Zap size={16} className="fill-current" />
          <span>Buy Now (₹{selectedPrice})</span>
        </button>
      </div>
    </main>
  );
};

export default ProductDetail;
