import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight, Tag, Sparkles } from "lucide-react";
import { BACKEND_URL } from "../config";
import "../Styles/promobanner.css";

const DEFAULT_FALLBACK_BANNERS = [
  {
    _id: "ramcart-showcase-1",
    tag: "FESTIVE COUTURE 2026",
    title: "Pure Silk Sarees & Handloom Weaves",
    description: "Grand Festival Dhamaka — Authentic Kanchipuram & Arani pure pattu with certified Silk Mark quality direct from weavers.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1600&auto=format&fit=crop",
    discountBadge: "FLAT 50% OFF",
    couponCode: "DIWALI50",
    targetLink: "/womens",
    themeClass: "theme-crimson-gold",
    accent: "#b45309"
  },
  {
    _id: "ramcart-showcase-2",
    tag: "MEN'S HERITAGE",
    title: "Handcrafted Kurtas & Pure Cotton Dhotis",
    description: "Tailored festive ethnic sets and premium 100% combed cotton shirts crafted for unmatched breathability and comfort.",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1600&auto=format&fit=crop",
    discountBadge: "FLAT 40% OFF",
    couponCode: "MENS40",
    targetLink: "/mens",
    themeClass: "theme-royal-indigo",
    accent: "#2563eb"
  },
  {
    _id: "ramcart-showcase-3",
    tag: "DAILY ESSENTIALS",
    title: "Everyday Kurtis, Tops & Denim Fits",
    description: "Ultra-breathable fabrics and contemporary modern silhouettes engineered for everyday office, college & casual outings.",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1600&auto=format&fit=crop",
    discountBadge: "STARTING ₹299",
    couponCode: "SAVE35",
    targetLink: "/catalog",
    themeClass: "theme-terracotta",
    accent: "#c2410c"
  },
  {
    _id: "ramcart-showcase-4",
    tag: "LITTLE CHAMPIONS",
    title: "Pattu Pavadai & Festive Kids Wear",
    description: "Vibrant traditional sets, cotton dhotis, and festive frocks woven with hypoallergenic, skin-friendly pure natural dyes.",
    image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?q=80&w=1600&auto=format&fit=crop",
    discountBadge: "EXTRA 30% OFF",
    couponCode: "KIDS30",
    targetLink: "/kids",
    themeClass: "theme-emerald",
    accent: "#059669"
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

  // Fetch active banners from backend or fallback
  useEffect(() => {
    let isMounted = true;
    let retryTimer = null;

    const fetchActiveBanners = async (attempt = 1) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(`${BACKEND_URL}/banners/active?page=${page}`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            // Normalize backend banner format to editorial template
            const formatted = data.map((b, idx) => ({
              _id: b._id || `ban-${idx}`,
              tag: b.tag || "FESTIVE SPOTLIGHT",
              title: b.title || b.description || "Seasonal Special Showcase",
              description: b.description || "Explore verified quality handpicked designs curated direct from master artisans.",
              image: b.image || DEFAULT_FALLBACK_BANNERS[idx % 4].image,
              discountBadge: b.discountValue 
                ? (b.discountType === "percentage" ? `${b.discountValue}% OFF` : `₹${b.discountValue} OFF`) 
                : "SPECIAL DEAL",
              couponCode: b.couponCode || "FESTIVE10",
              targetLink: b.targetLink || "/catalog",
              themeClass: DEFAULT_FALLBACK_BANNERS[idx % 4].themeClass,
              accent: DEFAULT_FALLBACK_BANNERS[idx % 4].accent
            }));
            setBanners(formatted);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        // Fallback to editorial defaults
      }

      if (isMounted) {
        if (page === "home") {
          setBanners((prev) => (prev.length > 0 ? prev : DEFAULT_FALLBACK_BANNERS));
        } else {
          setBanners((prev) => prev);
        }
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

  const activeSlides = banners.length > 0 ? banners : (page === "home" ? DEFAULT_FALLBACK_BANNERS : []);
  if (activeSlides.length === 0) {
    return null;
  }
  const totalSlides = activeSlides.length;

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Auto-play (5.5s interval with smooth progress)
  useEffect(() => {
    if (isHovered || totalSlides <= 1) return;
    const interval = setInterval(handleNext, 5500);
    return () => clearInterval(interval);
  }, [isHovered, totalSlides, handleNext]);

  const handleSlideClick = (targetLink) => {
    if (!targetLink) {
      navigate('/catalog');
      return;
    }
    if (targetLink.startsWith('http://') || targetLink.startsWith('https://')) {
      window.open(targetLink, '_blank', 'noopener,noreferrer');
    } else if (targetLink.startsWith('/')) {
      navigate(targetLink);
    } else {
      navigate(`/${targetLink}`);
    }
  };

  // Touch handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) handleNext();
    else if (diff < -45) handlePrev();
  };

  if (loading) {
    return (
      <div className="editorial-carousel-container animate-pulse">
        <div className="editorial-skeleton-box" />
      </div>
    );
  }

  const currentSlide = activeSlides[currentIndex] || activeSlides[0];

  return (
    <section 
      className="editorial-carousel-container"
      aria-label="Editorial Showcase Carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Main Square-Box Split Hero Stage ── */}
      <div className={`editorial-hero-stage ${currentSlide.themeClass}`}>
        
        {/* Left Side: Structured Editorial Typography Canvas */}
        <div className="editorial-content-panel">
          
          {/* Eyebrow & Badges */}
          <div className="editorial-tag-row">
            <span className="editorial-eyebrow">
              <Sparkles size={13} className="text-amber-500 fill-amber-500" />
              <span>{currentSlide.tag || "FESTIVE SPOTLIGHT"}</span>
            </span>

            {currentSlide.discountBadge && (
              <span className="editorial-discount-pill">
                <Tag size={12} />
                <span>{currentSlide.discountBadge}</span>
              </span>
            )}
          </div>

          {/* Main Headline */}
          <h2 className="editorial-headline">
            {currentSlide.title}
          </h2>

          {/* Subtitle / Description */}
          <p className="editorial-description">
            {currentSlide.description}
          </p>

          {/* Value Highlights */}
          <div className="editorial-perks-row">
            <span className="editorial-perk">✓ 100% Weavers Certified</span>
            <span className="editorial-perk">✓ Free Express Delivery</span>
            <span className="editorial-perk">✓ 7-Day Easy Returns</span>
          </div>

          {/* Action Row: Square Button + Coupon Code Pill */}
          <div className="editorial-action-row">
            <button
              type="button"
              onClick={() => handleSlideClick(currentSlide.targetLink)}
              className="editorial-cta-btn"
              title="Explore full collection"
            >
              <span>Explore Collection</span>
              <ArrowRight size={15} />
            </button>

            {currentSlide.couponCode && (
              <div 
                className="editorial-coupon-box"
                onClick={() => {
                  navigator.clipboard.writeText(currentSlide.couponCode);
                }}
                title="Click to copy coupon code"
              >
                <span className="coupon-prefix">CODE:</span>
                <span className="coupon-code">{currentSlide.couponCode}</span>
              </div>
            )}
          </div>

          {/* Modern Numeric Slide Tracker [ 01 / 04 ] + Progress Bar */}
          <div className="editorial-tracker-bar">
            <div className="editorial-counter">
              <span className="active-idx">0{currentIndex + 1}</span>
              <span className="divider">/</span>
              <span className="total-idx">0{totalSlides}</span>
            </div>

            <div className="editorial-progress-track">
              <div 
                className="editorial-progress-fill" 
                style={{ width: `${((currentIndex + 1) / totalSlides) * 100}%` }} 
              />
            </div>

            {/* Direct tactile slide step selectors */}
            <div className="editorial-dots-row">
              {activeSlides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`editorial-square-dot ${idx === currentIndex ? "active" : ""}`}
                  aria-label={`Jump to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Clean Unobscured Fashion Photography */}
        <div 
          className="editorial-media-panel"
          onClick={() => handleSlideClick(currentSlide.targetLink)}
          role="button"
          tabIndex={0}
        >
          <img
            key={currentSlide._id || currentIndex}
            src={currentSlide.image}
            alt={currentSlide.title}
            className="editorial-hero-image"
            loading="eager"
            decoding="async"
          />

          {/* Crisp square tag in the image corner */}
          <div className="editorial-image-tag">
            <span>Direct Weavers Edition</span>
          </div>
        </div>

        {/* ── Sharp Square Arrow Controls ── */}
        <button
          type="button"
          onClick={handlePrev}
          className="editorial-nav-btn prev"
          aria-label="Previous Slide"
        >
          <ChevronLeft size={18} />
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="editorial-nav-btn next"
          aria-label="Next Slide"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
};

export default PromoBanner;
