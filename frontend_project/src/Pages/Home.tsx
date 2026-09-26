import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PromoBanner from "../Components/PromoBanner";
import CategoryCard from "../Components/CategoryCard";
import ProductCard from "../Components/ProductCard";
import ProcessSteps from "../Components/ProcessSteps";
import Newsletter from "../Components/Newsletter";
import { TestimonialsSection } from "../Components/ui/testimonials-6";
import categories from "../data/categories";
import { fetchProducts } from "../features/catalog/services/productService";
import { Product } from "../features/catalog/types/productTypes";
import { Truck, RotateCcw, Shield, Tag } from "lucide-react";
import { fetchActivePromo } from "../features/catalog/services/promoService";
import { SeasonalPromo } from "../features/catalog/types/promoTypes";
import BankOffers from "../Components/BankOffers";
import "../Styles/productGrid.css";

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="product-card-skeleton" style={{ background: "rgba(255, 255, 255, 0.4)", backdropFilter: "blur(8px)", borderRadius: "17px", border: "1px solid var(--border-color)", overflow: "hidden" }}>
      <div className="shimmer-line" style={{ width: "100%", aspectRatio: "4/5", background: "rgba(120, 120, 120, 0.12)" }} />
      <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <div className="shimmer-line tag-shimmer" style={{ width: "40%", height: "9px", background: "rgba(120, 120, 120, 0.1)" }} />
        <div className="shimmer-line title-shimmer-1" style={{ width: "85%", height: "11px", background: "rgba(120, 120, 120, 0.08)" }} />
        <div className="shimmer-line title-shimmer-2" style={{ width: "55%", height: "11px", background: "rgba(120, 120, 120, 0.08)" }} />
      </div>
    </div>
  );
};

/* Cold-start / empty-state banner shown when backend is waking up */
export const BackendLoadingBanner: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <div style={{
    textAlign: "center",
    padding: "48px 24px",
    border: "1px dashed var(--border-color)",
    borderRadius: "16px",
    backgroundColor: "var(--bg-secondary)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    margin: "12px 0"
  }}>
    <div style={{
      width: "56px", height: "56px", borderRadius: "50%",
      background: "linear-gradient(135deg, var(--accent-pink), #a855f7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "pulse 2s ease-in-out infinite"
    }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    </div>
    <h3 style={{ margin: 0, fontWeight: "800", fontSize: "16px", color: "var(--text-primary)" }}>
      Server is waking up...
    </h3>
    <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", maxWidth: "360px", lineHeight: "1.6" }}>
      Our backend server is loading. This usually takes a few seconds on the first visit. Real products from the catalog will appear shortly.
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        style={{
          backgroundColor: "var(--accent-pink)", color: "white", fontWeight: "700",
          padding: "10px 28px", borderRadius: "8px", border: "none", fontSize: "13px",
          cursor: "pointer", transition: "transform 0.2s ease"
        }}
        onMouseOver={e => (e.currentTarget.style.transform = "scale(1.04)")}
        onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")}
      >
        🔄 Retry Now
      </button>
    )}
  </div>
);

export const Home: React.FC = () => {
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [activePromo, setActivePromo] = useState<SeasonalPromo | null>(null);

  const loadProducts = async (isRetry = false) => {
    if (!isRetry) setLoading(true);
    try {
      const [productsData, promoData] = await Promise.all([
        fetchProducts(),
        fetchActivePromo()
      ]);
      
      if (productsData && productsData.length > 0) {
        setProductsList(productsData);
        setRetryCount(0);
      } else if (retryCount < 6) {
        // Backend cold-starting — auto-retry after 5s
        setTimeout(() => setRetryCount(prev => prev + 1), 5000);
      }
      
      if (promoData) {
        setActivePromo(promoData);
      }
    } catch (err) {
      console.error("Failed to load products/promos for home page:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(retryCount > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount]);

  const handleRetry = () => {
    setLoading(true);
    setRetryCount(prev => prev + 1);
  };

  // Curate special selections
  const newCollections = productsList.slice(0, 8);
  const popularInWomen = productsList.filter(p => p.category === "women").slice(0, 8);
  const popularInMen = productsList.filter(p => p.category === "men").slice(0, 8);

  return (
    <>
      {/* Mobile Horizontal categories scroll (Flipkart style) */}
      <div className="mobile-categories-scroll">
        {categories.map((cat) => (
          <Link to={cat.link || `/${cat.id === "kid" ? "kids" : cat.id + "s"}`} key={cat.id} className="mob-cat-pill">
            <div className="mob-cat-img-wrapper">
              <img src={cat.image} alt={cat.name} className="mob-cat-img" />
            </div>
            <span className="mob-cat-name">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>

      {/* 1. Hero Promo Banner */}
      <PromoBanner />

      {/* ── Trust Bar (Flipkart-style strip) ── */}
      <div className="home-trust-bar">
        <div className="home-trust-item">
          <Truck size={18} className="home-trust-icon" />
          <div>
            <span className="home-trust-label">Free Delivery</span>
            <span className="home-trust-sub">On orders above ₹499</span>
          </div>
        </div>
        <div className="home-trust-divider" />
        <div className="home-trust-item">
          <RotateCcw size={18} className="home-trust-icon" />
          <div>
            <span className="home-trust-label">Easy Returns</span>
            <span className="home-trust-sub">30-day hassle-free returns</span>
          </div>
        </div>
        <div className="home-trust-divider" />
        <div className="home-trust-item">
          <Shield size={18} className="home-trust-icon" />
          <div>
            <span className="home-trust-label">Secure Payments</span>
            <span className="home-trust-sub">100% safe & encrypted</span>
          </div>
        </div>
        <div className="home-trust-divider" />
        <div className="home-trust-item">
          <Tag size={18} className="home-trust-icon" />
          <div>
            <span className="home-trust-label">Best Prices</span>
            <span className="home-trust-sub">50,000+ happy customers</span>
          </div>
        </div>
      </div>

      <main className="container home-main-container" id="main-content" style={{ marginTop: "24px" }}>
        {activePromo && activePromo.bankOffers && activePromo.bankOffers.length > 0 && (
          <BankOffers offers={activePromo.bankOffers} />
        )}

        {/* 2. Top Categories Grid — desktop only */}
        <section aria-labelledby="cat-heading" className="home-section desktop-only-section" style={{ marginTop: 0 }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <span style={{ color: "var(--accent-pink)", fontSize: "11px", fontWeight: "800", letterSpacing: "2px", textTransform: "uppercase" }}>
              Collections
            </span>
            <h2 id="cat-heading" style={{ fontSize: "20px", fontWeight: "800", marginTop: "6px", letterSpacing: "-0.3px", color: "var(--text-primary)" }}>
              Shop By Category
            </h2>
          </div>
          <div className="category-grid">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </section>

        {/* 3. New Collections Grid */}
        <section aria-labelledby="new-heading" className="home-section">
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: 8 }}>
            <div>
              <span style={{ color: "var(--accent-pink)", fontSize: "11px", fontWeight: "800", letterSpacing: "2px", textTransform: "uppercase" }}>
                🔥 New Drops
              </span>
              <h2 id="new-heading" style={{ fontSize: "20px", fontWeight: "800", marginTop: "4px", letterSpacing: "-0.3px", color: "var(--text-primary)" }}>
                Trending Now — New Arrivals
              </h2>
            </div>
            <Link to="/catalog" style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-pink)", whiteSpace: "nowrap" }}>
              View All →
            </Link>
          </div>
          <div className="product-grid horizontal-scroll-mobile">
            {loading
              ? [1, 2, 3, 4].map((id) => <ProductCardSkeleton key={id} />)
              : newCollections.length > 0
                ? newCollections.map((prod) => (
                    <ProductCard key={prod.id} product={prod} />
                  ))
                : null}
          </div>
          {!loading && productsList.length === 0 && (
            <BackendLoadingBanner onRetry={handleRetry} />
          )}
        </section>

        {/* 4. Process Value Propositions */}
        <ProcessSteps />

        {/* 5. Popular in Women */}
        <section aria-labelledby="women-heading" className="home-section">
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: 8 }}>
            <div>
              <span style={{ color: "var(--accent-pink)", fontSize: "11px", fontWeight: "800", letterSpacing: "2px", textTransform: "uppercase" }}>
                Trending
              </span>
              <h2 id="women-heading" style={{ fontSize: "20px", fontWeight: "800", marginTop: "4px", letterSpacing: "-0.3px", color: "var(--text-primary)" }}>
                Most Loved by Women 💕
              </h2>
            </div>
            <Link to="/womens" style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-pink)", whiteSpace: "nowrap" }}>
              View All →
            </Link>
          </div>
          <div className="product-grid horizontal-scroll-mobile">
            {loading
              ? [1, 2, 3, 4].map((id) => <ProductCardSkeleton key={id} />)
              : popularInWomen.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
          </div>
        </section>

        {/* 6. Popular in Men */}
        <section aria-labelledby="men-heading" className="home-section">
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: 8 }}>
            <div>
              <span style={{ color: "var(--accent-pink)", fontSize: "11px", fontWeight: "800", letterSpacing: "2px", textTransform: "uppercase" }}>
                Top Picks
              </span>
              <h2 id="men-heading" style={{ fontSize: "20px", fontWeight: "800", marginTop: "4px", letterSpacing: "-0.3px", color: "var(--text-primary)" }}>
                Men's Style Edit 👔
              </h2>
            </div>
            <Link to="/mens" style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-pink)", whiteSpace: "nowrap" }}>
              View All →
            </Link>
          </div>
          <div className="product-grid horizontal-scroll-mobile">
            {loading
              ? [1, 2, 3, 4].map((id) => <ProductCardSkeleton key={id} />)
              : popularInMen.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
          </div>
        </section>

        {/* 7. Animated Testimonials (21st.dev) */}
        <TestimonialsSection />

        {/* 8. Newsletter Signup */}
        <Newsletter />
      </main>
    </>
  );
};

export default Home;
