import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Carousel } from "react-bootstrap";
import { BACKEND_URL } from "../config";
import "../Styles/theme.css";
import "../Styles/promobanner.css";

const DEFAULT_FALLBACK_BANNERS = [
  {
    _id: "default-1",
    description: "Elevate Your Style, Experience Premium Comfort.",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop",
    discountType: "percentage",
    discountValue: 50,
    targetLink: "/womens",
    tag: "NEW SEASON ARRIVALS",
  },
  {
    _id: "default-2",
    description: "Exclusive Men's Fashion & Trendsetting Outerwear.",
    image: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1600&auto=format&fit=crop",
    discountType: "percentage",
    discountValue: 40,
    targetLink: "/mens",
    tag: "FLAT 40% OFF MEGA SALE",
  },
  {
    _id: "default-3",
    description: "Kids & Baby Collection - Bright, Playful & Cozy.",
    image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?q=80&w=1600&auto=format&fit=crop",
    discountType: "fixed",
    discountValue: 500,
    targetLink: "/kids",
    tag: "EXPLORE KIDS COLLECTION",
  },
];

const PromoBanner = ({ page = "home" }) => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let retryTimer = null;

    const fetchActiveBanners = async (attempt = 1) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

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
        console.warn(`[PromoBanner] Attempt ${attempt} failed to fetch active banners:`, err);
      }

      if (isMounted) {
        // Fallback to default carousel slides if fetch failed or returned empty
        setBanners((prev) => (prev.length > 0 ? prev : DEFAULT_FALLBACK_BANNERS));
        setLoading(false);

        // Auto-retry once after 4s in case backend server was waking up
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

  if (loading) {
    return (
      <div className="promo-wrapper">
        <div className="hero-slide-skeleton">
          <div className="shimmer-line tag-shimmer"></div>
          <div className="shimmer-line title-shimmer-1"></div>
          <div className="shimmer-line title-shimmer-2"></div>
          <div className="shimmer-line subtitle-shimmer"></div>
          <div className="btn-shimmer-row">
            <div className="shimmer-line btn-shimmer"></div>
            <div className="shimmer-line btn-shimmer"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="promo-wrapper">
      <Carousel
        fade
        indicators={activeSlides.length > 1}
        controls={activeSlides.length > 1}
        interval={4500}
        style={{ overflow: "hidden" }}
      >
        {activeSlides.map((ban, idx) => (
          <Carousel.Item key={ban._id ?? idx}>
            <div
              className="hero-slide carousel-slide"
              style={{
                backgroundImage: ban.image
                  ? `linear-gradient(to right, rgba(15,17,21,0.88) 28%, rgba(15,17,21,0.22) 72%), url('${ban.image}')`
                  : "linear-gradient(135deg, #0f1115 0%, #1a1f2e 40%, #2d1b3d 70%, #1a1f2e 100%)",
                backgroundSize: "cover",
                backgroundPosition: "center top",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div className="hero-content">
                <span className="hero-promo-tag">
                  {ban.tag || (ban.discountType === "percentage"
                    ? `${ban.discountValue}% OFF PROMOTIONAL OFFER`
                    : ban.discountType === "fixed"
                    ? `₹${ban.discountValue} OFF PROMOTIONAL OFFER`
                    : "FEATURED PROMOTION")}
                </span>
                <h1 className="hero-title">{ban.description}</h1>
                <div className="hero-cta-row">
                  <Link to={ban.targetLink || "/womens"}>
                    <button className="hero-btn hero-btn-primary">
                      Explore Collection <ArrowRight size={15} />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </Carousel.Item>
        ))}
      </Carousel>
    </div>
  );
};

export default PromoBanner;
