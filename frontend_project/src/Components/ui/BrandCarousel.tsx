import React from 'react';

export interface BrandItem {
  id: string;
  name: string;
  logoUrl: string;
  category?: string;
  discountBadge?: string;
}

// Sample Meesho-inspired brand data
const MEESHO_BRANDS: BrandItem[] = [
  { id: '1', name: 'Plum', logoUrl: 'https://placehold.co/150x60/ffffff/581c87?text=Plum', discountBadge: 'Up to 50% OFF' },
  { id: '2', name: 'Nivea', logoUrl: 'https://placehold.co/150x60/ffffff/1e3a8a?text=NIVEA', discountBadge: 'Min 30% OFF' },
  { id: '3', name: 'Himalaya', logoUrl: 'https://placehold.co/150x60/ffffff/047857?text=Himalaya', discountBadge: 'Flat ₹100 OFF' },
  { id: '4', name: 'Mi', logoUrl: 'https://placehold.co/150x60/ffffff/c2410c?text=Mi', discountBadge: 'Best Price' },
  { id: '5', name: 'Bata', logoUrl: 'https://placehold.co/150x60/ffffff/b91c1c?text=Bata', discountBadge: 'Under ₹499' },
  { id: '6', name: 'WOW', logoUrl: 'https://placehold.co/150x60/ffffff/111827?text=WOW', discountBadge: 'Up to 60% OFF' },
];

interface BrandCarouselProps {
  brands?: BrandItem[];
  speedInSeconds?: number;
}

export const BrandCarousel: React.FC<BrandCarouselProps> = ({
  brands = MEESHO_BRANDS,
  speedInSeconds = 25,
}) => {
  // Duplicate array for seamless infinite looping
  const loopedBrands = [...brands, ...brands];

  return (
    <section className="w-full bg-[#f6efff] py-6 px-2 sm:px-4 overflow-hidden select-none">
      {/* Section Header */}
      <div className="max-w-7xl mx-auto mb-4 px-4 flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">
          Top Brands & Categories
        </h2>
        <span className="text-xs font-semibold text-[#8b5cf6] bg-white px-2.5 py-1 rounded-full shadow-sm border border-purple-100">
          Trusted Suppliers
        </span>
      </div>

      {/* Infinite Scroll Container */}
      <div className="relative w-full overflow-hidden">
        {/* Soft gradient masks for smooth edges */}
        <div className="absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-[#f6efff] to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-[#f6efff] to-transparent pointer-events-none" />

        <div
          className="flex gap-4 sm:gap-6 w-max animate-meesho-scroll hover:[animation-play-state:paused]"
          style={{ animationDuration: `${speedInSeconds}s` }}
        >
          {loopedBrands.map((brand, index) => (
            <div
              key={`${brand.id}-${index}`}
              className="group relative flex flex-col items-center justify-center bg-white rounded-2xl p-4 w-[160px] sm:w-[200px] h-[100px] sm:h-[110px] flex-shrink-0 shadow-sm border border-purple-50 transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer"
            >
              {/* Optional Discount Badge (Meesho Style) */}
              {brand.discountBadge && (
                <span className="absolute -top-2.5 bg-[#f43f5e] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {brand.discountBadge}
                </span>
              )}

              {/* Logo Container */}
              <div className="w-full h-full flex items-center justify-center p-2">
                <img
                  src={brand.logoUrl}
                  alt={`${brand.name} logo`}
                  className="max-h-full max-w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-200"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};