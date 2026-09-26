import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import ProductCard from "../Components/ProductCard";
import PromoBanner from "../Components/PromoBanner";
import { fetchProducts } from "../features/catalog/services/productService";
import { Product } from "../features/catalog/types/productTypes";
import { BackendLoadingBanner } from "./Home";
import { ArrowUpDown, Search, X, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import "../Styles/productGrid.css";

interface ShopProps {
  category?: string;
}

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const AVAILABLE_COLORS = ['Black', 'White', 'Navy', 'Beige', 'Charcoal', 'Red', 'Blue', 'Green', 'Pink'];
const ITEMS_PER_PAGE = 8;

const normalizeCatSlug = (val?: string | null): string => {
  if (!val) return "all";
  const s = val.toLowerCase().trim();
  if (s === "kid" || s === "kids") return "kids";
  if (s === "men" || s === "mens") return "men";
  if (s === "women" || s === "womens") return "women";
  return s;
};

export const Shop: React.FC<ShopProps> = ({ category = "all" }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams<{ categorySlug?: string }>();

  // Determine active category from route param (/category/:categorySlug), query param (?category=...), or prop
  const routeCategoryParam = params.categorySlug || searchParams.get("category");
  const initialCategory = normalizeCatSlug(routeCategoryParam || category);

  const searchParamQuery = searchParams.get("search") || "";
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Database products state
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter and Search States
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState("default");
  
  // Price range states
  const [priceRange, setPriceRange] = useState(3000);
  const [maxProductPrice, setMaxProductPrice] = useState(5000);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Mobile filters overlay toggle
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync URL search query parameter with state
  useEffect(() => {
    if (searchParamQuery !== null) {
      setSearchQuery(searchParamQuery);
      setDebouncedSearch(searchParamQuery);
    }
  }, [searchParamQuery]);

  // Sync category prop or route param with state
  useEffect(() => {
    const active = normalizeCatSlug(params.categorySlug || searchParams.get("category") || category);
    setSelectedCategory(active);
    setCurrentPage(1); // reset to page 1 on category change
  }, [category, params.categorySlug, searchParams]);

  // Load products with auto-retry on cold start
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const loadProducts = async () => {
      if (retryCount === 0) setLoading(true);
      try {
        const data = await fetchProducts();
        setProductsList(data);

        // Compute maximum price dynamically from database items
        if (data.length > 0) {
          const prices = data.map(p => p.newPrice);
          const highest = Math.max(...prices, 1000);
          setMaxProductPrice(highest);
          setPriceRange(highest);
        } else if (retryCount < 6) {
          // Backend cold-starting — auto-retry after 5s
          setTimeout(() => setRetryCount(prev => prev + 1), 5000);
        }
      } catch (err) {
        console.error("Failed to fetch shop products:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount]);

  const handleRetry = () => {
    setLoading(true);
    setRetryCount(prev => prev + 1);
  };

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Click outside to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle category navigation/clicks
  const handleCategoryChange = (newCat: string) => {
    const normalized = normalizeCatSlug(newCat);
    setSelectedCategory(normalized);
    setCurrentPage(1);
    if (normalized === "all") {
      navigate("/catalog");
    } else if (normalized === "men") {
      navigate("/mens");
    } else if (normalized === "women") {
      navigate("/womens");
    } else if (normalized === "kids") {
      navigate("/kids");
    }
  };

  // Toggle size chips
  const handleSizeToggle = (size: string) => {
    setCurrentPage(1);
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  // Toggle color chips
  const handleColorToggle = (color: string) => {
    setCurrentPage(1);
    setSelectedColors(prev => 
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  // Autocomplete Suggestions List
  const autocompleteSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return productsList
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(p => p.name)
      .slice(0, 5); // limit to top 5 suggestions
  }, [searchQuery, productsList]);

  // Reset all filters helper
  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedCategory("all");
    setSelectedSizes([]);
    setSelectedColors([]);
    setPriceRange(maxProductPrice);
    setSortOption("default");
    setCurrentPage(1);
    navigate("/catalog");
  };

  // Filtered & Sorted items calculation
  const processedProducts = useMemo(() => {
    let result = [...productsList];

    // Filter by Category
    if (selectedCategory !== "all") {
      result = result.filter(p => p.category?.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Filter by Search Query
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description?.toLowerCase().includes(q)
      );
    }

    // Filter by Sizes
    if (selectedSizes.length > 0) {
      result = result.filter(p => 
        p.sizes && p.sizes.some(size => selectedSizes.includes(size))
      );
    }

    // Filter by Colors
    if (selectedColors.length > 0) {
      result = result.filter(p => 
        p.colors && p.colors.some(color => selectedColors.includes(color))
      );
    }

    // Filter by Price Range
    result = result.filter(p => p.newPrice <= priceRange);

    // Sorting Options
    if (sortOption === "price-low") {
      result.sort((a, b) => a.newPrice - b.newPrice);
    } else if (sortOption === "price-high") {
      result.sort((a, b) => b.newPrice - a.newPrice);
    } else if (sortOption === "rating") {
      result.sort((a, b) => ((b as any).rating || 4) - ((a as any).rating || 4));
    } else if (sortOption === "newest") {
      result.sort((a, b) => {
        const timeA = a.createdAt?.seconds || new Date(a.createdAt).getTime() || 0;
        const timeB = b.createdAt?.seconds || new Date(b.createdAt).getTime() || 0;
        return timeB - timeA;
      });
    }

    return result;
  }, [productsList, selectedCategory, debouncedSearch, selectedSizes, selectedColors, priceRange, sortOption]);

  // Client-Side Pagination calculations
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [processedProducts, currentPage]);

  const totalPages = Math.ceil(processedProducts.length / ITEMS_PER_PAGE) || 1;

  // Skeleton card for loading state
  const SkeletonCard = () => (
    <div style={{ background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)", overflow: "hidden" }}>
      <div className="shimmer-line" style={{ width: "100%", aspectRatio: "4/5", background: "rgba(120,120,120,0.12)" }} />
      <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <div className="shimmer-line" style={{ width: "40%", height: "9px", background: "rgba(120,120,120,0.1)", borderRadius: "4px" }} />
        <div className="shimmer-line" style={{ width: "80%", height: "11px", background: "rgba(120,120,120,0.08)", borderRadius: "4px" }} />
        <div className="shimmer-line" style={{ width: "50%", height: "11px", background: "rgba(120,120,120,0.08)", borderRadius: "4px" }} />
      </div>
    </div>
  );

  // Sidebar Filters Component
  const renderFilters = () => (
    <div className="shop-filters-container">
      <div className="filter-section-header">
        <h3 className="filter-main-title">Filters</h3>
        {(selectedSizes.length > 0 || selectedColors.length > 0 || searchQuery.trim() || priceRange < maxProductPrice) && (
          <button onClick={handleResetFilters} className="filter-clear-btn">
            Clear All
          </button>
        )}
      </div>

      {/* Sizes filter chips */}
      <div className="filter-group">
        <span className="filter-group-title">Sizes</span>
        <div className="size-chips-grid">
          {AVAILABLE_SIZES.map((sz) => {
            const isActive = selectedSizes.includes(sz);
            return (
              <button
                key={sz}
                onClick={() => handleSizeToggle(sz)}
                className={`size-chip${isActive ? " active" : ""}`}
              >
                {sz}
              </button>
            );
          })}
        </div>
      </div>

      {/* Colors filter circles */}
      <div className="filter-group">
        <span className="filter-group-title">Colors</span>
        <div className="color-chips-grid">
          {AVAILABLE_COLORS.map((col) => {
            const isActive = selectedColors.includes(col);
            return (
              <button
                key={col}
                onClick={() => handleColorToggle(col)}
                title={col}
                className={`color-chip-circle${isActive ? " active" : ""}`}
                style={{ backgroundColor: col.toLowerCase() }}
              />
            );
          })}
        </div>
      </div>

      {/* Price Range Slider */}
      <div className="filter-group">
        <div className="filter-price-label-row">
          <span>Max Price</span>
          <span className="price-val">₹{priceRange}</span>
        </div>
        <input 
          type="range" 
          min="0"
          max={maxProductPrice}
          value={priceRange} 
          onChange={(e) => { setPriceRange(Number(e.target.value)); setCurrentPage(1); }}
          className="price-slider-input"
        />
        <div className="price-slider-bounds">
          <span>₹0</span>
          <span>₹{maxProductPrice}</span>
        </div>
      </div>
    </div>
  );

  return (
    <main className="container" style={{ padding: "32px var(--space-4) 80px", color: 'var(--text-primary)' }}>
      {/* Category Promotion Header Banner */}
      {selectedCategory !== "all" && (
        <PromoBanner page={selectedCategory === "kid" ? "kids" : selectedCategory} />
      )}

      {/* Top Bar - Categories Navigation Chips */}
      <div className="shop-top-navigation">
        <div className="category-toggle-tabs">
          {["all", "men", "women", "kid"].map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`category-tab-pill${selectedCategory === cat ? " active" : ""}`}
            >
              {cat === "all" ? "All" : cat === "kid" ? "Kids" : cat}
            </button>
          ))}
        </div>

        {/* Autocomplete Search input */}
        <div className="shop-search-wrapper" ref={suggestionRef}>
          <Search size={16} className="search-icon-inside" />
          <input 
            type="text" 
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            className="shop-search-input"
          />
          {searchQuery && (
            <button 
              onClick={() => { setSearchQuery(""); setDebouncedSearch(""); }}
              className="search-clear-btn"
            >
              <X size={14} />
            </button>
          )}

          {/* Suggestions Dropdown */}
          {showSuggestions && autocompleteSuggestions.length > 0 && (
            <div className="search-suggestions-dropdown">
              {autocompleteSuggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSearchQuery(sug); setShowSuggestions(false); }}
                  className="search-suggestion-item"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile action bar for filters & sorting */}
      <div className="mobile-action-bar">
        <button 
          onClick={() => setMobileFiltersOpen(true)}
          className="mobile-action-btn"
        >
          <SlidersHorizontal size={14} />
          Filters
        </button>
        <div className="mobile-sort-select-wrapper">
          <ArrowUpDown size={12} className="sort-icon-mobile" />
          <select
            value={sortOption}
            onChange={(e) => { setSortOption(e.target.value); setCurrentPage(1); }}
            className="mobile-sort-select"
          >
            <option value="default">Sort by: Relevance</option>
            <option value="newest">New Arrivals</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="shop-layout-grid">
        {/* Left Column: Filters (Desktop only) */}
        <aside className="shop-sidebar">
          {renderFilters()}
        </aside>

        {/* Right Column: Catalog Grid */}
        <div className="shop-content">
          <div className="catalog-header-row">
            <span className="results-count">
              Showing {processedProducts.length} premium designs
            </span>
            <div className="sort-select-wrapper-desktop">
              <ArrowUpDown size={12} className="sort-icon-desktop" />
              <select
                value={sortOption}
                onChange={(e) => { setSortOption(e.target.value); setCurrentPage(1); }}
                className="desktop-sort-select"
              >
                <option value="default">Sort by: Relevance</option>
                <option value="newest">New Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="product-grid">
              {[1,2,3,4,5,6,7,8].map((id) => <SkeletonCard key={id} />)}
            </div>
          ) : productsList.length === 0 ? (
            <BackendLoadingBanner onRetry={handleRetry} />
          ) : processedProducts.length === 0 ? (
            <div className="catalog-empty-state">
              <p>No products match your active filters.</p>
              <button 
                className="clear-all-action-btn"
                onClick={handleResetFilters}
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {paginatedProducts.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination-wrapper">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="pagination-arrow-btn"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    const isActive = currentPage === pageNum;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className={`pagination-num-btn${isActive ? " active" : ""}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="pagination-arrow-btn"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filters Slide-up Drawer */}
      {mobileFiltersOpen && (
        <div className="mobile-filters-overlay">
          <div className="mobile-filters-drawer-backdrop" onClick={() => setMobileFiltersOpen(false)} />
          <div className="mobile-filters-drawer">
            <div className="drawer-header">
              <h3>Filters</h3>
              <button 
                onClick={() => setMobileFiltersOpen(false)}
                className="drawer-close-btn"
              >
                <X size={18} />
              </button>
            </div>
            <div className="drawer-content">
              {renderFilters()}
            </div>
            <div className="drawer-footer">
              <button 
                onClick={() => setMobileFiltersOpen(false)}
                className="drawer-apply-btn"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Shop;
