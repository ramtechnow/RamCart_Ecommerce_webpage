import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { BACKEND_URL } from "../config";
import "../Styles/promobanner.css";

const DEFAULT_FALLBACK_BANNERS = [
  {
    _id: "ramcart-showcase-1",
    description: "Grand Wardrobe Festival — Exclusive Seasonal Drops",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1600&auto=format&fit=crop",
    discountType: "percentage",
    discountValue: 50,
    targetLink: "/womens",
    tag: "RAMCART EXCLUSIVE",
    badge: "SEASON SPECIAL"
  },
  {
    _id: "ramcart-showcase-2",
    description: "Everyday Classics, Polos & Tailored Outerwear",
    image: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1600&auto=format&fit=crop",
    discountType: "percentage",
    discountValue: 40,
    targetLink: "/mens",
    tag: "BESTSELLER EDIT",
    badge: "TRENDING NOW"
  },
  {
    _id: "ramcart-showcase-3",
    description: "Urban Travel Gear & Structured Essentials",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1600&auto=format&fit=crop",
    discountType: "percentage",
    discountValue: 35,
    targetLink: "/catalog",
    tag: "NEW DROP",
    badge: "TOP PICK"
  },
  {
    _id: "ramcart-showcase-4",
    description: "High-Performance Layers & Studio Comfortwear",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1600&auto=format&fit=crop",
    discountType: "percentage",
    discountValue: 45,
    targetLink: "/catalog",
    tag: "LIMITED EDITION",
    badge: "FEATURED"
  },
  {
    _id: "ramcart-showcase-5",
    description: "Kids & Juniors Vibrant Play Collection",
    image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?q=80&w=1600&auto=format&fit=crop",
    discountType: "percentage",
    discountValue: 30,
    targetLink: "/kids",
    tag: "PLAYFUL STYLES",
    badge: "NEW ARRIVAL"
  }
];

export const PromoBanner = ({ page = "home" }) => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Touch swipe handling
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isDragging = useRef(false);

  // Fetch active banners from backend or fallback
  useEffect(() => {
    let isMounted = true;
    let retryTimer = null;

    const fetchActiveBanners = async (attempt = 1) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`${BACKEND_URL}/banners/active?page=${page}`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setBanners(data);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn(`[PromoBanner] Attempt ${attempt} failed:`, err);
      }

      if (isMounted) {
        setBanners((prev) => (prev.length > 0 ? prev : DEFAULT_FALLBACK_BANNERS));
        setLoading(false);

        if (attempt === 1) {
          retryTimer = setTimeout(() => {
            if (isMounted) fetchActiveBanners(2);
          }, 4000);
        }
      }
    };

    fetchActiveBanners(1);

    return () => {
      isMounted = false;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [page]);

  const activeSlides = banners.length > 0 ? banners : DEFAULT_FALLBACK_BANNERS;
  const totalSlides = activeSlides.length;

  // Next & Prev slide handlers
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Auto-play (every 4.5 seconds when not hovered)
  useEffect(() => {
    if (isHovered || totalSlides <= 1) return;
    const interval = setInterval(handleNext, 4500);
    return () => clearInterval(interval);
  }, [isHovered, totalSlides, handleNext]);

  // Click on a banner card -> navigate to target product/category
  const handleBannerClick = (banner) => {
    if (isDragging.current) return;
    if (!banner) return;
    const link = banner.targetLink;
    if (!link) {
      navigate('/womens');
      return;
    }

    if (link.startsWith('http://') || link.startsWith('https://')) {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else if (link.startsWith('/')) {
      navigate(link);
    } else if (!isNaN(Number(link))) {
      navigate(`/product/${link}`);
    } else {
      navigate(`/${link}`);
    }
  };

  // Touch event handlers for mobile swiping
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    isDragging.current = false;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
    if (Math.abs(touchEndX.current - touchStartX.current) > 10) {
      isDragging.current = true;
    }
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 40; // min swipe distance in px
    if (diff > threshold) {
      handleNext();
    } else if (diff < -threshold) {
      handlePrev();
    }
    setTimeout(() => {
      isDragging.current = false;
    }, 50);
  };

  if (loading) {
    return (
      <div className="ramcart-promo-carousel-wrapper">
        <div className="ramcart-promo-skeleton-card animate-pulse" />
      </div>
    );
  }

  return (
    <section 
      className="ramcart-promo-carousel-wrapper"
      aria-label="Promotional Deals Carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ─── Main Carousel Container ─── */}
      <div 
        className="ramcart-promo-carousel-viewport"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="ramcart-promo-carousel-track"
          style={{
            transform: `translateX(calc(-${currentIndex} * var(--slide-step, 100%)))`
          }}
        >
          {activeSlides.map((ban, idx) => {
            const isSlideActive = idx === currentIndex;
            const discountLabel = ban.discountValue
              ? ban.discountType === "percentage"
                ? `${ban.discountValue}% OFF`
                : `₹${ban.discountValue} OFF`
              : null;

            return (
              <div
                key={ban._id || idx}
                onClick={() => handleBannerClick(ban)}
                className={`ramcart-promo-banner-card ${isSlideActive ? 'is-active' : ''}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleBannerClick(ban);
                  }
                }}
                aria-label={`Banner: ${ban.description || 'Promotional Offer'}`}
              >
                {/* Banner Background Image */}
                <img
                  src={ban.image}
                  alt={ban.description || "Special offer banner"}
                  className="ramcart-promo-banner-img"
                  loading={idx < 2 ? "eager" : "lazy"}
                  decoding="async"
                />

                {/* Subtle dark gradient overlay for text readability */}
                <div className="ramcart-promo-banner-gradient" />

                {/* RAMCART Style Content & Badges */}
                <div className="ramcart-promo-banner-content">
                  {/* Top Tags */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="ramcart-promo-badge-earlybird">
                      <Zap size={11} className="fill-current" />
                      {ban.tag || "EARLY BIRD DEALS"}
                    </span>
                    {discountLabel && (
                      <span className="ramcart-promo-badge-discount">
                        {discountLabel}
                      </span>
                    )}
                  </div>

                  {/* Main Title / Description */}
                  <h2 className="ramcart-promo-banner-title">
                    {ban.description}
                  </h2>

                  {/* Partner / Bank Offers Strip */}
                  <div className="ramcart-promo-bank-strip">
                    <span className="bank-pill">RamCart Pay</span>
                    <span className="bank-pill">All Cards</span>
                    <span className="bank-text">{ban.bankOfferText || "Instant Discount on Prepaid Orders*"}</span>
                  </div>
                </div>

                {/* Offer tag */}
                <div className="ramcart-promo-ad-tag">OFFER</div>
              </div>
            );
          })}
        </div>

        {/* ─── Floating Desktop Navigation Arrows ─── */}
        {totalSlides > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="ramcart-promo-nav-arrow prev"
              aria-label="Previous Slide"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="ramcart-promo-nav-arrow next"
              aria-label="Next Slide"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* ─── RAMCART Signature Elongated Pill Indicators ─── */}
      {totalSlides > 1 && (
        <div className="ramcart-promo-indicators" aria-label="Slide Indicators">
          {activeSlides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`ramcart-promo-indicator-dot ${idx === currentIndex ? "active" : "inactive"}`}
              aria-label={`Go to slide ${idx + 1}`}
              aria-current={idx === currentIndex ? "true" : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default PromoBanner;
