import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PromoBanner from "../Components/PromoBanner";
import ProductCard from "../Components/ProductCard";
import ProcessSteps from "../Components/ProcessSteps";
import Newsletter from "../Components/Newsletter";
import { TestimonialsSection } from "../Components/ui/testimonials-6";
import { fetchProducts } from "../features/catalog/services/productService";
import { Product } from "../features/catalog/types/productTypes";
import { Truck, RotateCcw, Shield, Tag } from "lucide-react";
import { fetchActivePromo } from "../features/catalog/services/promoService";
import { SeasonalPromo } from "../features/catalog/types/promoTypes";
import BankOffers from "../Components/BankOffers";
import "../Styles/productGrid.css";

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="product-card-skeleton" style={{ background: "var(--bg-secondary)", borderRadius: "4px", border: "1px solid var(--border-color)", overflow: "hidden" }}>
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
      {/* 1. Hero Promo Banner (Flipkart-style multi-card peeking carousel) */}
      <PromoBanner />

      {/* ── Double-Bezel Floating Trust Capsule (Hardware-grade aesthetic) ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 my-6 sm:my-8">
        <div className="p-1 sm:p-1.5 rounded-2xl sm:rounded-3xl bg-black/[0.02] dark:bg-white/[0.03] ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
          <div className="rounded-xl sm:rounded-2xl bg-white/95 dark:bg-[#171622]/95 backdrop-blur-xl border border-black/5 dark:border-white/5 p-3.5 sm:p-5 flex items-center justify-between sm:justify-around gap-4 overflow-x-auto no-scrollbar">
            
            <div className="group flex items-center gap-3 shrink-0">
              <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-[#ff8906]/10 dark:bg-[#ff8906]/20 flex items-center justify-center text-[#ff8906] transition-transform duration-300 group-hover:scale-110 shrink-0">
                <Truck size={18} />
              </div>
              <div>
                <span className="block text-xs sm:text-sm font-extrabold text-[#0f0e17] dark:text-[#fffffe] leading-tight">
                  Free Express Delivery
                </span>
                <span className="block text-[10px] sm:text-[11px] text-[#717388] dark:text-[#a7a9be] mt-0.5 font-medium">
                  On all orders above ₹499
                </span>
              </div>
            </div>

            <div className="hidden sm:block w-px h-8 bg-black/5 dark:bg-white/10 shrink-0" />

            <div className="group flex items-center gap-3 shrink-0">
              <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-[#ff8906]/10 dark:bg-[#ff8906]/20 flex items-center justify-center text-[#ff8906] transition-transform duration-300 group-hover:scale-110 shrink-0">
                <RotateCcw size={18} />
              </div>
              <div>
                <span className="block text-xs sm:text-sm font-extrabold text-[#0f0e17] dark:text-[#fffffe] leading-tight">
                  Hassle-Free Returns
                </span>
                <span className="block text-[10px] sm:text-[11px] text-[#717388] dark:text-[#a7a9be] mt-0.5 font-medium">
                  30-day doorstep exchange
                </span>
              </div>
            </div>

            <div className="hidden sm:block w-px h-8 bg-black/5 dark:bg-white/10 shrink-0" />

            <div className="group flex items-center gap-3 shrink-0">
              <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-[#ff8906]/10 dark:bg-[#ff8906]/20 flex items-center justify-center text-[#ff8906] transition-transform duration-300 group-hover:scale-110 shrink-0">
                <Shield size={18} />
              </div>
              <div>
                <span className="block text-xs sm:text-sm font-extrabold text-[#0f0e17] dark:text-[#fffffe] leading-tight">
                  Encrypted Checkout
                </span>
                <span className="block text-[10px] sm:text-[11px] text-[#717388] dark:text-[#a7a9be] mt-0.5 font-medium">
                  100% bank-grade security
                </span>
              </div>
            </div>

            <div className="hidden sm:block w-px h-8 bg-black/5 dark:bg-white/10 shrink-0" />

            <div className="group flex items-center gap-3 shrink-0">
              <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-[#ff8906]/10 dark:bg-[#ff8906]/20 flex items-center justify-center text-[#ff8906] transition-transform duration-300 group-hover:scale-110 shrink-0">
                <Tag size={18} />
              </div>
              <div>
                <span className="block text-xs sm:text-sm font-extrabold text-[#0f0e17] dark:text-[#fffffe] leading-tight">
                  Unbeatable Value
                </span>
                <span className="block text-[10px] sm:text-[11px] text-[#717388] dark:text-[#a7a9be] mt-0.5 font-medium">
                  50,000+ satisfied patrons
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      <main className="container home-main-container" id="main-content" style={{ marginTop: "16px" }}>
        {activePromo && activePromo.bankOffers && activePromo.bankOffers.length > 0 && (
          <BankOffers offers={activePromo.bankOffers} />
        )}

        {/* ── 2. The Asymmetrical Fashion Bento Grid (Curated Collections) ── */}
        <section aria-labelledby="cat-heading" className="my-10 sm:my-14">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] font-extrabold bg-[#ff8906]/10 text-[#ff8906] border border-[#ff8906]/20 dark:bg-[#ff8906]/15 dark:border-[#ff8906]/30 mb-2.5">
              CURATED EDITIONS
            </span>
            <h2 id="cat-heading" className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0f0e17] dark:text-[#fffffe]">
              Signature Wardrobe Collections
            </h2>
            <p className="text-xs sm:text-sm text-[#717388] dark:text-[#a7a9be] max-w-lg mx-auto mt-1">
              Explore hand-picked seasonal edits crafted for comfort, elegance, and everyday versatility.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* Bento Card 1 (Grand Hero: Women's Collection) */}
            <Link
              to="/womens"
              className="group relative lg:col-span-2 min-h-[380px] sm:min-h-[440px] rounded-3xl overflow-hidden shadow-sm border border-black/5 dark:border-white/10 flex flex-col justify-between p-6 sm:p-8 transition-all duration-500 hover:shadow-xl cursor-pointer"
            >
              <img
                src="/women_category.png"
                alt="Women's Collection"
                className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 group-hover:via-black/50 transition-colors" />

              {/* Top Pill Badge */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-white/20 backdrop-blur-md text-white border border-white/20 shadow-sm">
                  🔥 380+ Trending Styles • Most Loved
                </span>
                <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest hidden sm:inline-block">
                  RamCart Exclusive
                </span>
              </div>

              {/* Bottom Content Area with Button-in-Button CTA */}
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-auto">
                <div className="max-w-md">
                  <span className="text-[10px] font-mono font-bold text-[#ff8906] uppercase tracking-[0.2em] block mb-1">
                    SIGNATURE EDIT
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                    Women's Haute &amp; Festive Edit
                  </h3>
                  <p className="text-xs sm:text-sm text-white/80 line-clamp-2 mt-1.5 leading-relaxed">
                    Ethereal ethnic sets, chic contemporary dresses, flowy tops &amp; premium layering.
                  </p>
                </div>

                <div className="group-hover:translate-x-1 transition-transform duration-300">
                  <div className="inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full text-xs font-bold text-[#0f0e17] bg-white hover:bg-[#ff8906] hover:text-white transition-all duration-300 shadow-md">
                    <span>Explore Women</span>
                    <span className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center text-[10px]">
                      ↗
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Bento Stack (Men's & Kids) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5 sm:gap-6">
              
              {/* Bento Card 2: Men's Collection */}
              <Link
                to="/mens"
                className="group relative min-h-[210px] sm:min-h-[210px] rounded-3xl overflow-hidden shadow-sm border border-black/5 dark:border-white/10 flex flex-col justify-between p-5 sm:p-6 transition-all duration-500 hover:shadow-lg cursor-pointer"
              >
                <img
                  src="/men_category.png"
                  alt="Men's Collection"
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 transition-colors" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 backdrop-blur-md text-white border border-white/20">
                    👔 245+ Sharp Fits
                  </span>
                </div>

                <div className="relative z-10 flex items-end justify-between gap-2 mt-auto">
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                      Men's Modern Essentials
                    </h3>
                    <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                      Sharp blazers, organic polos &amp; tailored street chinos.
                    </p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white text-[#0f0e17] group-hover:bg-[#ff8906] group-hover:text-white flex items-center justify-center text-xs font-bold shrink-0 transition-colors shadow-sm">
                    ↗
                  </div>
                </div>
              </Link>

              {/* Bento Card 3: Kids Collection */}
              <Link
                to="/kids"
                className="group relative min-h-[210px] sm:min-h-[210px] rounded-3xl overflow-hidden shadow-sm border border-black/5 dark:border-white/10 flex flex-col justify-between p-5 sm:p-6 transition-all duration-500 hover:shadow-lg cursor-pointer"
              >
                <img
                  src="/kids_category.png"
                  alt="Kids Collection"
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 transition-colors" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 backdrop-blur-md text-white border border-white/20">
                    🧸 180+ Playful Picks
                  </span>
                </div>

                <div className="relative z-10 flex items-end justify-between gap-2 mt-auto">
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                      Kids &amp; Junior Wardrobe
                    </h3>
                    <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                      Cozy dungarees, festive dresses &amp; active wear.
                    </p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white text-[#0f0e17] group-hover:bg-[#ff8906] group-hover:text-white flex items-center justify-center text-xs font-bold shrink-0 transition-colors shadow-sm">
                    ↗
                  </div>
                </div>
              </Link>

            </div>
          </div>
        </section>

        {/* ── 3. New Collections Grid ── */}
        <section aria-labelledby="new-heading" className="my-10 sm:my-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] uppercase tracking-[0.2em] font-extrabold bg-[#ff8906]/10 text-[#ff8906] border border-[#ff8906]/20 dark:bg-[#ff8906]/15 dark:border-[#ff8906]/30 mb-2">
                🔥 NEW DROPS
              </span>
              <h2 id="new-heading" className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0f0e17] dark:text-[#fffffe]">
                Trending Now — New Arrivals
              </h2>
              <p className="text-xs text-[#717388] dark:text-[#a7a9be] mt-0.5">
                Fresh drops added this week, curated for seasonal versatility.
              </p>
            </div>
            <Link 
              to="/catalog" 
              className="group self-start sm:self-auto inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-[#ff8906] hover:text-white dark:hover:bg-[#ff8906] transition-all duration-300 shadow-sm border border-black/5 dark:border-white/10"
            >
              <span>Explore All</span>
              <span className="w-6 h-6 rounded-full bg-white dark:bg-zinc-700 group-hover:bg-white/20 flex items-center justify-center text-[10px] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300">
                ↗
              </span>
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

        {/* ── 4. Process Value Propositions (Double-Bezel Hardware Architecture) ── */}
        <ProcessSteps />

        {/* ── 5. Popular in Women ── */}
        <section aria-labelledby="women-heading" className="my-10 sm:my-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] uppercase tracking-[0.2em] font-extrabold bg-[#e53170]/10 text-[#e53170] border border-[#e53170]/20 dark:bg-[#e53170]/15 dark:border-[#e53170]/30 mb-2">
                💎 SIGNATURE WOMEN
              </span>
              <h2 id="women-heading" className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0f0e17] dark:text-[#fffffe]">
                Most Loved by Women 💕
              </h2>
              <p className="text-xs text-[#717388] dark:text-[#a7a9be] mt-0.5">
                Top-rated silhouettes celebrating grace, vibrant palettes, and effortless styling.
              </p>
            </div>
            <Link 
              to="/womens" 
              className="group self-start sm:self-auto inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-[#e53170] hover:text-white dark:hover:bg-[#e53170] transition-all duration-300 shadow-sm border border-black/5 dark:border-white/10"
            >
              <span>Explore Women</span>
              <span className="w-6 h-6 rounded-full bg-white dark:bg-zinc-700 group-hover:bg-white/20 flex items-center justify-center text-[10px] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300">
                ↗
              </span>
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

        {/* ── 6. Popular in Men ── */}
        <section aria-labelledby="men-heading" className="my-10 sm:my-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] uppercase tracking-[0.2em] font-extrabold bg-[#ff8906]/10 text-[#ff8906] border border-[#ff8906]/20 dark:bg-[#ff8906]/15 dark:border-[#ff8906]/30 mb-2">
                ⚡ MEN'S ESSENTIALS
              </span>
              <h2 id="men-heading" className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0f0e17] dark:text-[#fffffe]">
                Men's Style Edit 👔
              </h2>
              <p className="text-xs text-[#717388] dark:text-[#a7a9be] mt-0.5">
                Precision-tailored classics and breathable leisurewear built for modern routines.
              </p>
            </div>
            <Link 
              to="/mens" 
              className="group self-start sm:self-auto inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-[#ff8906] hover:text-white dark:hover:bg-[#ff8906] transition-all duration-300 shadow-sm border border-black/5 dark:border-white/10"
            >
              <span>Explore Men</span>
              <span className="w-6 h-6 rounded-full bg-white dark:bg-zinc-700 group-hover:bg-white/20 flex items-center justify-center text-[10px] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300">
                ↗
              </span>
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

        {/* ── 7. Animated Testimonials ── */}
        <TestimonialsSection />

        {/* ── 8. Newsletter Signup ── */}
        <Newsletter />
      </main>
    </>
  );
};

export default Home;
