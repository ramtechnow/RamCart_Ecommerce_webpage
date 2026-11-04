import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Copy, Check, X, Flame } from "lucide-react";
import { useAppDispatch } from "../store/hooks";
import { addToast } from "../store/slices/toastSlice";

interface FestiveCelebrationBannerProps {
  festivalTitle?: string;
  promoText?: string;
  couponCode?: string;
  discountBadge?: string;
  mediaType?: "fireworks" | "video" | "gif";
  mediaUrl?: string; // Optional custom video (.mp4) or animated gif URL
}

export const FestiveCelebrationBanner: React.FC<FestiveCelebrationBannerProps> = ({
  festivalTitle = "🪔 GRAND FESTIVE DHAMAKA SALE",
  promoText = "Grand Festive Deals are Live! Extra 30% Savings on Pure Silk Sarees, Dhotis & Daily Wear",
  couponCode = "DIWALI30",
  discountBadge = "FLAT 30% OFF",
  mediaType = "fireworks",
  mediaUrl
}) => {
  const dispatch = useAppDispatch();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Visibility state (persisted in localStorage or session)
  const [isVisible, setIsVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [fireworksActive, setFireworksActive] = useState(true);

  // Check user preference
  useEffect(() => {
    const saved = localStorage.getItem("ramcart_festive_banner_dismissed");
    if (saved === "true") {
      // Allow reopening if requested, default to visible
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("ramcart_festive_banner_dismissed", "true");
  };

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    dispatch(addToast({ message: `Coupon code "${couponCode}" copied! Use at checkout.`, type: "success" }));
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Realistic Festive Crackers & Fireworks Canvas Engine ──────────────────
  useEffect(() => {
    if (!fireworksActive || !canvasRef.current || !isVisible) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      color: string;
      size: number;
      decay: number;
    }> = [];

    const colors = [
      "#f59e0b", // Gold
      "#f43f5e", // Festive Pink
      "#10b981", // Emerald
      "#38bdf8", // Sky Blue
      "#e11d48", // Crimson
      "#ffffff"  // Starlight White
    ];

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || 120;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Launch a cracker burst
    const spawnFirework = (targetX?: number, targetY?: number) => {
      const x = targetX !== undefined ? targetX : Math.random() * canvas.width;
      const y = targetY !== undefined ? targetY : 20 + Math.random() * (canvas.height - 40);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const particleCount = 28;

      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const speed = 1.5 + Math.random() * 3.5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color,
          size: 1.5 + Math.random() * 2,
          decay: 0.015 + Math.random() * 0.02
        });
      }
    };

    let lastSpawn = 0;
    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (time - lastSpawn > 850) {
        spawnFirework();
        if (Math.random() > 0.4) {
          setTimeout(() => spawnFirework(), 200);
        }
        lastSpawn = time;
      }

      // Update & render particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04; // Gentle gravity
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [fireworksActive, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 my-4 sm:my-6">
      <div 
        className="relative overflow-hidden rounded-md shadow-lg transition-all duration-300"
        style={{
          background: "linear-gradient(135deg, #1f0b12 0%, #3d0c1e 35%, #500724 70%, #1c0812 100%)",
          border: "1.5px solid rgba(251, 191, 36, 0.45)",
          boxShadow: "0 12px 30px -8px rgba(244, 63, 94, 0.3), 0 0 20px rgba(245, 158, 11, 0.15)"
        }}
      >
        {/* ── Background Media: Fireworks Canvas, Video, or GIF ── */}
        {mediaType === "video" && mediaUrl ? (
          <video
            src={mediaUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
          />
        ) : mediaType === "gif" && mediaUrl ? (
          <img
            src={mediaUrl}
            alt="Festive background animation"
            className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
          />
        ) : (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            style={{ opacity: fireworksActive ? 1 : 0, transition: "opacity 0.3s ease" }}
          />
        )}

        {/* Ambient Decorative Lighting */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-pink-500/25 rounded-full blur-3xl pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 p-4 sm:p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Festive Headline & Badges */}
          <div className="flex items-center gap-3.5 sm:gap-4 text-center md:text-left flex-1 min-w-0">
            <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 items-center justify-center text-white shadow-lg shrink-0 animate-bounce">
              <Flame size={24} />
            </div>

            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-black shadow-xs">
                  {discountBadge}
                </span>
                <span className="text-[10px] font-bold text-amber-200/90 tracking-wide uppercase hidden sm:inline">
                  Special Festive Edition
                </span>
              </div>

              <h2 className="text-base sm:text-xl font-black text-white tracking-tight leading-tight m-0 drop-shadow-sm">
                {festivalTitle}
              </h2>

              <p className="text-xs text-rose-100/80 leading-normal max-w-xl hidden sm:block">
                {promoText}
              </p>
            </div>
          </div>

          {/* Right: Coupon Pill, Shop CTA & Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap justify-center shrink-0">
            {/* 1-Click Copy Coupon Code */}
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-amber-200 border border-amber-400/40 text-xs font-mono font-bold transition-all cursor-pointer shadow-xs"
              title="Click to copy promo code"
            >
              <span>{couponCode}</span>
              {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
            </button>

            {/* Shop Deals Link */}
            <Link
              to="/catalog?sort=price-low"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-extrabold text-xs transition-all shadow-md hover:scale-105 active:scale-95 no-underline"
            >
              <Sparkles size={14} />
              <span>Shop Deals</span>
            </Link>

            {/* Crackers Animation Toggle (Enable / Disable) */}
            <button
              type="button"
              onClick={() => setFireworksActive(prev => !prev)}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer text-xs ${
                fireworksActive 
                  ? "bg-amber-400/20 border-amber-400/40 text-amber-300 hover:bg-amber-400/30" 
                  : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
              }`}
              title={fireworksActive ? "Pause Crackers Animation" : "Enable Crackers Animation"}
              aria-label="Toggle Crackers Animation"
            >
              {fireworksActive ? <Sparkles size={14} /> : <X size={14} />}
            </button>

            {/* Close / Dismiss Banner */}
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/50 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Dismiss festive banner"
              aria-label="Dismiss banner"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FestiveCelebrationBanner;
