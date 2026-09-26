import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CreditCard, ShieldCheck, ChevronLeft, ChevronRight, Sparkles, Tag, Check, Copy } from 'lucide-react';
import { BankOffer } from '../features/catalog/types/promoTypes';

interface BankOffersProps {
  offers: BankOffer[];
}

// Bank gradient palette map for recognizable e-commerce card look
const getBankGradient = (bankName: string = '', badgeColor?: string) => {
  const name = bankName.toUpperCase();
  if (name.includes('HDFC')) {
    return 'linear-gradient(135deg, #004c8f 0%, #002244 100%)';
  }
  if (name.includes('ICICI')) {
    return 'linear-gradient(135deg, #b83a1b 0%, #6d1c07 100%)';
  }
  if (name.includes('SBI')) {
    return 'linear-gradient(135deg, #007bb6 0%, #003756 100%)';
  }
  if (name.includes('AXIS')) {
    return 'linear-gradient(135deg, #97144d 0%, #4a0322 100%)';
  }
  if (name.includes('KOTAK')) {
    return 'linear-gradient(135deg, #e31837 0%, #850b1d 100%)';
  }
  if (name.includes('AMEX') || name.includes('AMERICAN')) {
    return 'linear-gradient(135deg, #006fcf 0%, #002e5b 100%)';
  }
  if (badgeColor && badgeColor.startsWith('#')) {
    return `linear-gradient(135deg, ${badgeColor} 0%, #0f0e17 100%)`;
  }
  return 'linear-gradient(135deg, #2b2a3a 0%, #171622 100%)';
};

export const BankOffers: React.FC<BankOffersProps> = ({ offers = [] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const checkScrollButtons = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScrollButtons();
    const scroller = scrollRef.current;
    if (scroller) {
      scroller.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
    }
    return () => {
      if (scroller) scroller.removeEventListener('scroll', checkScrollButtons);
      window.removeEventListener('resize', checkScrollButtons);
    };
  }, [offers, checkScrollButtons]);

  // Auto-scroll loop (pauses when user hovers or touches)
  useEffect(() => {
    if (offers.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 15) {
          // Wrap around smoothly to beginning
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
        }
      }
    }, 4500);

    return () => clearInterval(timer);
  }, [offers.length, isPaused]);

  if (!offers || offers.length === 0) return null;

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleCopyOffer = (offer: BankOffer, idx: number) => {
    const textToCopy = `${offer.bank}: ${offer.offer} (Min Order: ₹${offer.minOrder})`;
    navigator.clipboard?.writeText(textToCopy);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <section 
      aria-labelledby="bank-offers-heading" 
      className="bank-offers-section"
      style={{ 
        marginTop: '28px', 
        marginBottom: '36px',
        position: 'relative'
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Header with Title & Navigation Controls */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '16px',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #ff8906 0%, #e53170 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fffffe',
            boxShadow: '0 4px 12px rgba(255, 137, 6, 0.25)'
          }}>
            <CreditCard size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h2 id="bank-offers-heading" style={{ 
                fontSize: '17px', 
                fontWeight: '800', 
                margin: 0, 
                letterSpacing: '-0.3px', 
                color: 'var(--text-primary)' 
              }}>
                Exclusive Bank & Payment Offers
              </h2>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '10px',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 137, 6, 0.15)',
                color: '#ff8906',
                textTransform: 'uppercase'
              }}>
                <Sparkles size={10} /> Instant
              </span>
            </div>
            <p style={{ 
              margin: '2px 0 0 0', 
              fontSize: '12px', 
              color: 'var(--text-secondary)', 
              fontWeight: '500' 
            }}>
              Extra savings auto-applied on partner cards at checkout
            </p>
          </div>
        </div>

        {/* Carousel Navigation Buttons (Flipkart/Amazon Style) */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            aria-label="Previous bank offers"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: canScrollLeft ? 'var(--text-primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: canScrollLeft ? 'pointer' : 'default',
              opacity: canScrollLeft ? 1 : 0.4,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label="Next bank offers"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: canScrollRight ? 'var(--text-primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: canScrollRight ? 'pointer' : 'default',
              opacity: canScrollRight ? 1 : 0.4,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Carousel Track with Edge Fades */}
      <div style={{ position: 'relative' }}>
        <div
          ref={scrollRef}
          className="bank-offers-carousel"
          style={{
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            paddingBottom: '8px',
            paddingTop: '2px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {offers.map((offer, idx) => {
            const cardBg = getBankGradient(offer.bank, offer.badgeColor);
            const accent = offer.badgeColor || '#ff8906';
            const isCopied = copiedIndex === idx;

            return (
              <div
                key={idx}
                onClick={() => handleCopyOffer(offer, idx)}
                role="button"
                tabIndex={0}
                title="Click to copy offer details"
                style={{
                  flex: '0 0 310px',
                  scrollSnapAlign: 'start',
                  background: cardBg,
                  borderRadius: '16px',
                  padding: '18px 20px',
                  color: '#ffffff',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 12px 28px rgba(0, 0, 0, 0.24), 0 0 16px ${accent}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.16)';
                }}
              >
                {/* Decorative chip & card circuit lines */}
                <div style={{
                  position: 'absolute',
                  top: '-30px',
                  right: '-30px',
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  pointerEvents: 'none'
                }} />

                {/* Top Row: Bank Badge + Copy/Applied indicator */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.18)',
                      backdropFilter: 'blur(8px)',
                      fontSize: '11px',
                      fontWeight: '900',
                      letterSpacing: '0.8px',
                      textTransform: 'uppercase',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      {offer.bank}
                    </div>
                  </div>

                  <span style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    color: isCopied ? '#10b981' : 'rgba(255, 255, 255, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: isCopied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    padding: '3px 8px',
                    borderRadius: '20px',
                    transition: 'all 0.2s'
                  }}>
                    {isCopied ? (
                      <>
                        <Check size={11} /> Saved
                      </>
                    ) : (
                      <>
                        <Copy size={10} /> Auto-Apply
                      </>
                    )}
                  </span>
                </div>

                {/* Main Offer Text */}
                <div style={{ marginBottom: '14px' }}>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: '800',
                    lineHeight: '1.35',
                    color: '#ffffff',
                    letterSpacing: '-0.2px'
                  }}>
                    {offer.offer}
                  </p>
                </div>

                {/* Card Bottom Row: Min Order & Terms */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                  fontSize: '11px'
                }}>
                  {offer.minOrder > 0 ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontWeight: '600'
                    }}>
                      <ShieldCheck size={13} style={{ color: '#ff8906' }} /> Min spend ₹{offer.minOrder.toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontWeight: '600'
                    }}>
                      <Tag size={12} style={{ color: '#ff8906' }} /> No min order limit
                    </span>
                  )}

                  <span style={{
                    fontSize: '10px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontWeight: '600'
                  }}>
                    T&amp;C Apply
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BankOffers;
