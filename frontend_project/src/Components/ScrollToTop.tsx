/* ============================================================
   ScrollToTop.tsx — Global floating "Back to Top" button
   Appears after scrolling 300px. Smooth scroll on click.
   Automatically offsets higher on Product Detail Page on mobile
   so it NEVER overlaps with the sticky "Add to Cart / Buy Now" bar!
   ============================================================ */
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ChevronUp } from "lucide-react";

const ScrollToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  const isPDP = location.pathname.startsWith("/product");

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      setVisible(scrolled > 300);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    // Run initially in case page is already scrolled
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollUp = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollUp}
      aria-label="Scroll to top"
      className={`scroll-to-top-btn ${isPDP ? "scroll-to-top-pdp" : ""}`}
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transform: visible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.85)",
      }}
    >
      <ChevronUp size={20} strokeWidth={2.5} />
    </button>
  );
};

export default ScrollToTop;
