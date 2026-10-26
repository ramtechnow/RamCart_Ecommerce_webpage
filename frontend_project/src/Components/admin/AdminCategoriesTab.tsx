import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Check, 
  RefreshCw, 
  Eye, 
  Layers, 
  RotateCcw, 
  CheckCircle2
} from 'lucide-react';
import { adminApi } from '../../Utils/adminApi';

interface CategoryCard {
  _id?: string;
  categoryKey: 'women' | 'men' | 'kids';
  name: string;
  title: string;
  subtitle: string;
  badgeText: string;
  tagline: string;
  image: string;
  link: string;
  objectPosition: string;
}

interface AdminCategoriesTabProps {
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  triggerConfirm: (config: any) => void;
  logAction: (action: string) => void;
}

const DEFAULT_CARDS: Record<string, CategoryCard> = {
  women: {
    categoryKey: 'women',
    name: "Women's Collection",
    title: "Women's Haute & Festive Edit",
    subtitle: "Ethereal ethnic sets, chic contemporary dresses, flowy tops & premium layering.",
    badgeText: "🔥 380+ Trending Styles",
    tagline: "SIGNATURE EDIT",
    image: "/women_category.png",
    link: "/womens",
    objectPosition: "top"
  },
  men: {
    categoryKey: 'men',
    name: "Men's Collection",
    title: "Men's Modern Essentials",
    subtitle: "Sharp blazers, organic polos & tailored street chinos.",
    badgeText: "👔 245+ Sharp Fits",
    tagline: "SMART CASUALS",
    image: "/men_category.png",
    link: "/mens",
    objectPosition: "top"
  },
  kids: {
    categoryKey: 'kids',
    name: "Kids Collection",
    title: "Kids & Junior Wardrobe",
    subtitle: "Cozy dungarees, festive dresses & active wear.",
    badgeText: "🧸 180+ Playful Picks",
    tagline: "PLAY & COMFORT",
    image: "/kids_category.png",
    link: "/kids",
    objectPosition: "top"
  }
};

export const AdminCategoriesTab: React.FC<AdminCategoriesTabProps> = ({
  addToast,
  triggerConfirm,
  logAction
}) => {
  const [cards, setCards] = useState<Record<string, CategoryCard>>(DEFAULT_CARDS);
  const [activeKey, setActiveKey] = useState<'women' | 'men' | 'kids'>('women');
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  // File input ref for image upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current cards from backend
  const loadCards = async () => {
    setLoading(true);
    try {
      const data = await adminApi.fetchCategoryCards();
      if (Array.isArray(data) && data.length > 0) {
        const mapped: Record<string, CategoryCard> = { ...DEFAULT_CARDS };
        data.forEach((c: CategoryCard) => {
          if (c.categoryKey && mapped[c.categoryKey]) {
            mapped[c.categoryKey] = { ...mapped[c.categoryKey], ...c };
          }
        });
        setCards(mapped);
      }
    } catch (err: any) {
      console.warn("Using default category cards due to error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const activeCard = cards[activeKey] || DEFAULT_CARDS[activeKey];

  const handleFieldChange = (field: keyof CategoryCard, val: string) => {
    setCards(prev => ({
      ...prev,
      [activeKey]: {
        ...prev[activeKey],
        [field]: val
      }
    }));
  };

  // Compress image file to base64 WebP/JPEG under 100KB
  const handleImageUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/webp', 0.82);
          handleFieldChange('image', compressed);
          addToast('Image uploaded and optimized successfully', 'success');
        }
      };
    };
  };

  // Save changes to backend
  const handleSave = async (keyToSave = activeKey) => {
    const cardToSave = cards[keyToSave];
    if (!cardToSave) return;
    setSavingKey(keyToSave);

    try {
      await adminApi.updateCategoryCard(cardToSave);
      addToast(`${cardToSave.name} updated successfully!`, 'success');
      logAction(`Updated Home Category Card: ${cardToSave.name}`);
    } catch (err: any) {
      addToast(err.message || 'Failed to update category card', 'error');
    } finally {
      setSavingKey(null);
    }
  };

  // Factory reset
  const handleReset = () => {
    triggerConfirm({
      title: "Reset Category Cards?",
      message: "This will reset Women, Men, and Kids cards to original system defaults. Any custom uploaded photos will be replaced with default images.",
      confirmText: "Yes, Reset All",
      isDestructive: true,
      onConfirm: async () => {
        setResetting(true);
        try {
          await adminApi.resetCategoryCards();
          setCards(DEFAULT_CARDS);
          addToast("Category cards reset to factory defaults", "info");
          logAction("Reset category showcase cards to default");
        } catch (err: any) {
          addToast("Failed to reset cards", "error");
        } finally {
          setResetting(false);
        }
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#171622] border border-[#e2e4ed]/40 dark:border-white/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#ff8906]/10 text-[#ff8906]">
              <Layers size={18} />
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0f0e17] dark:text-[#fffffe]">
              Category Showcase Management
            </h2>
          </div>
          <p className="text-xs text-[#717388] dark:text-[#a7a9be]">
            Control the curated Women, Men, and Kids cards displayed on the Home Page. Change images, titles, and focal points to prevent cropped heads or overflow.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadCards}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-[#e2e4ed]/60 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Reload</span>
          </button>

          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* ── Category Tabs Switcher ── */}
      <div className="grid grid-cols-3 gap-3 p-1.5 rounded-2xl bg-zinc-100 dark:bg-[#212030] border border-black/5 dark:border-white/5">
        {(['women', 'men', 'kids'] as const).map(key => {
          const item = cards[key];
          const isSelected = activeKey === key;
          return (
            <button
              key={key}
              onClick={() => setActiveKey(key)}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                isSelected
                  ? 'bg-white dark:bg-[#171622] text-[#ff8906] shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                  : 'text-[#52525b] dark:text-[#a1a1aa] hover:text-[#0f0e17] dark:hover:text-white'
              }`}
            >
              <span>{key === 'women' ? '👩' : key === 'men' ? '👨' : '🧒'}</span>
              <span className="capitalize">{item.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── Main Editor & Live Preview Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#171622] border border-[#e2e4ed]/40 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#e2e4ed]/30 dark:border-white/5">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0f0e17] dark:text-[#fffffe]">
                Edit {activeCard.name}
              </h3>
              <p className="text-[11px] text-[#717388] dark:text-[#a7a9be]">
                Updating settings for route <code className="text-[#ff8906]">{activeCard.link}</code>
              </p>
            </div>
            
            <button
              onClick={() => handleSave()}
              disabled={savingKey === activeKey}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#ff8906] hover:bg-[#e53170] text-white shadow-sm transition-all duration-200"
            >
              {savingKey === activeKey ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>

          {/* Image Upload & Management */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-extrabold text-[#0f0e17] dark:text-white flex items-center justify-between">
              <span>Category Cover Photo</span>
              <span className="text-[10px] font-normal text-[#717388] dark:text-[#a7a9be]">
                Portrait photos recommended (min 600×800)
              </span>
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-xl border border-dashed border-[#e2e4ed] dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40">
              <div className="w-20 h-24 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 bg-zinc-200 dark:bg-zinc-800 shrink-0 relative">
                <img
                  src={activeCard.image}
                  alt={activeCard.name}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: activeCard.objectPosition }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo192.png';
                  }}
                />
              </div>

              <div className="flex-1 flex flex-col gap-2 w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0f0e17] text-white dark:bg-white dark:text-[#0f0e17] hover:opacity-90 transition-opacity"
                  >
                    <Upload size={13} />
                    <span>Upload New Photo</span>
                  </button>
                  <span className="text-[11px] text-[#717388] dark:text-[#a7a9be]">
                    Auto-optimized to fast WebP
                  </span>
                </div>

                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-[10px] font-semibold text-[#717388] dark:text-[#a7a9be]">Or paste direct Image URL:</span>
                  <input
                    type="text"
                    value={activeCard.image.startsWith('data:') ? '— Uploaded Custom Image Base64 —' : activeCard.image}
                    onChange={(e) => handleFieldChange('image', e.target.value)}
                    placeholder="https://images.unsplash.com/... or /women_category.png"
                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-[#e2e4ed]/60 dark:border-zinc-700 bg-white dark:bg-[#212030] text-[#0f0e17] dark:text-white outline-none focus:border-[#ff8906]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Focal Point / Object Position */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-extrabold text-[#0f0e17] dark:text-white flex items-center justify-between">
              <span>Image Focal Point (Prevents Head Cropping)</span>
              <span className="text-[10px] text-[#ff8906] font-semibold">Recommended: Top</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Top (Faces & Heads)', val: 'top' },
                { label: 'Center (Balanced)', val: 'center' },
                { label: 'Bottom (Lower Half)', val: 'bottom' }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => handleFieldChange('objectPosition', opt.val)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    activeCard.objectPosition === opt.val
                      ? 'border-[#ff8906] bg-[#ff8906]/10 text-[#ff8906]'
                      : 'border-[#e2e4ed]/60 dark:border-zinc-700 text-[#52525b] dark:text-[#a1a1aa] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#0f0e17] dark:text-white">Pill Badge Text</label>
              <input
                type="text"
                value={activeCard.badgeText}
                onChange={(e) => handleFieldChange('badgeText', e.target.value)}
                placeholder="e.g. 🔥 380+ Trending Styles"
                className="w-full h-9 px-3 text-xs rounded-xl border border-[#e2e4ed]/60 dark:border-zinc-700 bg-white dark:bg-[#212030] text-[#0f0e17] dark:text-white outline-none focus:border-[#ff8906]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#0f0e17] dark:text-white">Editorial Tagline</label>
              <input
                type="text"
                value={activeCard.tagline}
                onChange={(e) => handleFieldChange('tagline', e.target.value)}
                placeholder="e.g. SIGNATURE EDIT"
                className="w-full h-9 px-3 text-xs rounded-xl border border-[#e2e4ed]/60 dark:border-zinc-700 bg-white dark:bg-[#212030] text-[#0f0e17] dark:text-white outline-none focus:border-[#ff8906]"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#0f0e17] dark:text-white">Card Main Title</label>
              <input
                type="text"
                value={activeCard.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="e.g. Women's Haute & Festive Edit"
                className="w-full h-9 px-3 text-xs font-semibold rounded-xl border border-[#e2e4ed]/60 dark:border-zinc-700 bg-white dark:bg-[#212030] text-[#0f0e17] dark:text-white outline-none focus:border-[#ff8906]"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#0f0e17] dark:text-white">Subtitle / Description</label>
              <textarea
                rows={2}
                value={activeCard.subtitle}
                onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                placeholder="Brief description of this collection..."
                className="w-full p-3 text-xs rounded-xl border border-[#e2e4ed]/60 dark:border-zinc-700 bg-white dark:bg-[#212030] text-[#0f0e17] dark:text-white outline-none focus:border-[#ff8906] resize-none"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#0f0e17] dark:text-white">Destination Route</label>
              <input
                type="text"
                value={activeCard.link}
                onChange={(e) => handleFieldChange('link', e.target.value)}
                placeholder="/womens, /mens, or /kids"
                className="w-full h-9 px-3 text-xs rounded-xl border border-[#e2e4ed]/60 dark:border-zinc-700 bg-white dark:bg-[#212030] text-[#0f0e17] dark:text-white outline-none focus:border-[#ff8906]"
              />
            </div>

          </div>

          <div className="mt-2 pt-4 border-t border-[#e2e4ed]/30 dark:border-white/5 flex justify-end">
            <button
              onClick={() => handleSave()}
              disabled={savingKey === activeKey}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-[#ff8906] hover:bg-[#e53170] text-white shadow-md shadow-[#ff8906]/20 transition-all duration-200"
            >
              {savingKey === activeKey ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Publish to Home Page</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Right Column: Live Responsive Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#717388] dark:text-[#a7a9be] flex items-center gap-1.5">
              <Eye size={14} />
              <span>Live Front-End Card Preview</span>
            </span>
            <span className="text-[10px] font-bold text-[#ff8906] px-2 py-0.5 rounded-full bg-[#ff8906]/10">
              Responsive
            </span>
          </div>

          {/* Render Preview Card */}
          <div className="relative w-full aspect-[3/4] max-h-[460px] rounded-3xl overflow-hidden shadow-lg border border-black/10 dark:border-white/10 flex flex-col justify-between p-6 transition-all duration-300">
            <img
              src={activeCard.image}
              alt={activeCard.title}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
              style={{ objectPosition: activeCard.objectPosition || 'top' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo192.png';
              }}
            />

            {/* Subtle scrim gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

            {/* Top Badge */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/20 shadow-sm">
                {activeCard.badgeText || 'Exclusive Pick'}
              </span>
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
                RamCart
              </span>
            </div>

            {/* Bottom Content Area */}
            <div className="relative z-10 flex flex-col gap-2 mt-auto">
              <div>
                {activeCard.tagline && (
                  <span className="text-[10px] font-mono font-bold text-[#ff8906] uppercase tracking-[0.2em] block mb-1">
                    {activeCard.tagline}
                  </span>
                )}
                <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
                  {activeCard.title || activeCard.name}
                </h3>
                {activeCard.subtitle && (
                  <p className="text-xs text-white/90 line-clamp-2 mt-1 leading-relaxed">
                    {activeCard.subtitle}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <div className="inline-flex items-center gap-2 pl-4 pr-2 py-1.5 rounded-full text-xs font-bold text-[#0f0e17] bg-white hover:bg-[#ff8906] hover:text-white transition-all duration-300 shadow-md">
                  <span>Explore {activeCard.name.replace(' Collection', '')}</span>
                  <span className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center text-[10px]">
                    ↗
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
            💡 <strong>Pro Tip:</strong> When uploading photos of models, keeping the focal point set to <strong>Top</strong> ensures that their head, face, and collar remain visible across both desktop widescreen monitors and mobile phones.
          </div>

        </div>

      </div>
    </div>
  );
};
