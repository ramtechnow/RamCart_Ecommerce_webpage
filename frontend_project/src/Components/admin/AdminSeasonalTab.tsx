import React, { useState, useEffect } from 'react';
import { Sparkles, Save, Plus, Trash2, Loader2, Megaphone } from 'lucide-react';
import { fetchActivePromo, savePromo } from '../../features/catalog/services/promoService';
import { SeasonalPromo, BankOffer } from '../../features/catalog/types/promoTypes';

interface AdminSeasonalTabProps {
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  logAction: (action: string) => void;
}

export const AdminSeasonalTab: React.FC<AdminSeasonalTabProps> = ({ addToast, logAction }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Database settings fields state
  const [theme, setTheme] = useState('General');
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementBg, setAnnouncementBg] = useState('linear-gradient(90deg, #ec4899, #8b5cf6)');
  const [enableParticles, setEnableParticles] = useState(false);
  const [particleType, setParticleType] = useState('star');
  const [bankOffers, setBankOffers] = useState<BankOffer[]>([]);

  // New bank offer creation state
  const [newBank, setNewBank] = useState('');
  const [newBadgeColor, setNewBadgeColor] = useState('#004B87');
  const [newOfferText, setNewOfferText] = useState('');
  const [newMinOrder, setNewMinOrder] = useState('1000');

  // Themes list mapping
  const THEME_OPTIONS = [
    { value: 'General', label: 'General / No Theme' },
    { value: 'VinayagarChaturthi', label: '🕉️ Vinayagar Chaturthi Theme' },
    { value: 'Diwali', label: '🪔 Diwali Light Festival Theme' },
    { value: 'NewYear', label: '🎈 New Year Celebration Theme' },
    { value: 'Pongal', label: '🌾 Pongal Harvest Festival Theme' }
  ];

  // Preset background gradient selections
  const GRADIENT_PRESETS = [
    { value: 'linear-gradient(90deg, #ec4899, #8b5cf6)', label: 'Pink Violet (General)' },
    { value: 'linear-gradient(90deg, #f59e0b, #ef4444)', label: 'Orange Red (Festive Vinayagar / Diwali)' },
    { value: 'linear-gradient(90deg, #10b981, #059669)', label: 'Green Emerald (Harvest Pongal)' },
    { value: 'linear-gradient(90deg, #3b82f6, #1d4ed8)', label: 'Blue Ocean (New Year)' },
    { value: '#0f172a', label: 'Slate Dark (Minimalist)' }
  ];

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await fetchActivePromo();
        if (settings) {
          setTheme(settings.theme || 'General');
          setAnnouncementText(settings.announcementText || '');
          setAnnouncementBg(settings.announcementBg || 'linear-gradient(90deg, #ec4899, #8b5cf6)');
          setEnableParticles(settings.enableParticles || false);
          setParticleType(settings.particleType || 'star');
          setBankOffers(settings.bankOffers || []);
        }
      } catch (err) {
        addToast('Failed to load seasonal configuration from database collections', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddBankOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBank.trim() || !newOfferText.trim()) {
      addToast('Please enter Bank name and promotional offer description', 'warning');
      return;
    }

    const offer: BankOffer = {
      bank: newBank.trim(),
      badgeColor: newBadgeColor,
      offer: newOfferText.trim(),
      minOrder: Number(newMinOrder) || 0
    };

    setBankOffers(prev => [...prev, offer]);
    setNewBank('');
    setNewOfferText('');
    addToast('💳 Added credit/debit card offer successfully', 'info');
  };

  const handleRemoveBankOffer = (idx: number) => {
    setBankOffers(prev => prev.filter((_, i) => i !== idx));
    addToast('Removed promotional card offer', 'info');
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const data: SeasonalPromo = {
        theme,
        announcementText,
        announcementBg,
        enableParticles,
        particleType,
        bankOffers
      };
      await savePromo(data);
      addToast('✨ Seasonal settings saved & synchronized successfully!', 'success');
      logAction(`Saved new Festive Promo configs: Theme=${theme}, ActiveParticles=${enableParticles}`);
    } catch (err: any) {
      addToast(err.message || 'Failed to sync promo configurations', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    if (newTheme === 'VinayagarChaturthi' || newTheme === 'Diwali') {
      setParticleType('lamp');
      setAnnouncementBg('linear-gradient(90deg, #f59e0b, #ef4444)');
      setEnableParticles(true);
    } else if (newTheme === 'NewYear') {
      setParticleType('balloon');
      setAnnouncementBg('linear-gradient(90deg, #3b82f6, #1d4ed8)');
      setEnableParticles(true);
    } else if (newTheme === 'Pongal') {
      setParticleType('flower');
      setAnnouncementBg('linear-gradient(90deg, #10b981, #059669)');
      setEnableParticles(true);
    } else {
      setParticleType('star');
      setEnableParticles(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 size={32} className="animate-spin text-[#7C3AED]" />
        <span className="text-xs font-semibold text-[#9CA3AF]">Syncing seasonal settings from database collections...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full text-[#1E1B4B] dark:text-[#F5F3FF]">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Seasonal &amp; Festive Settings</h2>
          <p className="text-sm text-[#9CA3AF] mt-0.5">Control live storefront theme templates, drift decorations, and card promo highlights.</p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-6 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-[#7C3AED]/20 disabled:opacity-75 border-none transition-all duration-150 text-xs"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>{saving ? "Saving Configurations..." : "Save Settings"}</span>
        </button>
      </div>

      {/* Bento Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Bento: Theme and particle options */}
        <div className="bg-white dark:bg-[#141428] rounded-2xl border border-[#DDD6FE]/40 dark:border-white/10 p-6 flex flex-col gap-5 shadow-sm transition-colors duration-200">
          <h3 className="text-xs font-black text-[#6D28D9] dark:text-[#A78BFA] uppercase tracking-wider border-b border-[#DDD6FE]/20 dark:border-white/5 pb-3 flex items-center gap-2">
            <Sparkles size={16} /> Theme &amp; Decoration Settings
          </h3>

          {/* Theme select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#4B5563] dark:text-[#C4B5FD]">Live Page Festive Template Theme</label>
            <select
              value={theme}
              onChange={(e) => handleThemeChange(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-[#DDD6FE]/40 bg-white dark:bg-[#1A1A35] text-xs font-semibold outline-none cursor-pointer"
            >
              {THEME_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Announcement text */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#4B5563] dark:text-[#C4B5FD]">Top Announcement Header Marquee Text</label>
            <textarea
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="e.g. 🎉 Vinayagar Chaturthi Sale: Get up to 10% Instant Discount on HDFC Cards! &bull; Free Shipping on orders above ₹1,000"
              rows={3}
              className="w-full p-3.5 rounded-xl border border-[#DDD6FE]/40 bg-white dark:bg-[#1A1A35] text-xs outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Gradient backdrop select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#4B5563] dark:text-[#C4B5FD]">Marquee Banner Background Style</label>
            <select
              value={announcementBg}
              onChange={(e) => setAnnouncementBg(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-[#DDD6FE]/40 bg-white dark:bg-[#1A1A35] text-xs font-semibold outline-none cursor-pointer"
            >
              {GRADIENT_PRESETS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={announcementBg}
              onChange={(e) => setAnnouncementBg(e.target.value)}
              placeholder="Custom color hex or linear-gradient css value"
              className="w-full h-10 px-3.5 rounded-xl border border-[#DDD6FE]/40 bg-white dark:bg-[#1A1A35] text-xs outline-none font-mono"
            />
          </div>

          {/* Particles active state */}
          <div className="flex items-center gap-3 pt-3 border-t border-[#DDD6FE]/20 dark:border-white/5 mt-1">
            <input
              type="checkbox"
              id="enable-particles-toggle"
              checked={enableParticles}
              onChange={(e) => setEnableParticles(e.target.checked)}
              className="w-4 h-4 text-[#7C3AED] border-gray-300 rounded focus:ring-[#7C3AED] cursor-pointer"
            />
            <label htmlFor="enable-particles-toggle" className="text-xs font-bold text-[#1E1B4B] dark:text-[#F5F3FF] cursor-pointer selection:bg-transparent select-none">
              Enable drifting festive background elements
            </label>
          </div>

          {/* Particles dropdown selection */}
          {enableParticles && (
            <div className="flex flex-col gap-1.5 animate-slide-down">
              <label className="text-xs font-bold text-[#4B5563] dark:text-[#C4B5FD]">Drifting element decoration shape</label>
              <select
                value={particleType}
                onChange={(e) => setParticleType(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-[#DDD6FE]/40 bg-white dark:bg-[#1A1A35] text-xs font-semibold outline-none cursor-pointer"
              >
                <option value="star">Shining golden stars (General)</option>
                <option value="lamp">Clay glowing lamps / Diya (Vinayagar/Diwali)</option>
                <option value="flower">Traditional flower petals (Pongal/Spring)</option>
                <option value="balloon">Floating balloons (Festivals/Celebrations)</option>
              </select>
            </div>
          )}
        </div>

        {/* Right Bento: Credit cards manager */}
        <div className="bg-white dark:bg-[#141428] rounded-2xl border border-[#DDD6FE]/40 dark:border-white/10 p-6 flex flex-col gap-5 shadow-sm transition-colors duration-200">
          <h3 className="text-xs font-black text-[#6D28D9] dark:text-[#A78BFA] uppercase tracking-wider border-b border-[#DDD6FE]/20 dark:border-white/5 pb-3 flex items-center gap-2">
            <Megaphone size={16} /> Manage Active Bank Offers
          </h3>

          {/* New promo create form */}
          <form onSubmit={handleAddBankOffer} className="flex flex-col gap-4 border-b border-[#DDD6FE]/20 dark:border-white/5 pb-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#4B5563] dark:text-[#C4B5FD]">Bank Provider Name</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank"
                  value={newBank}
                  onChange={(e) => setNewBank(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#DDD6FE]/40 bg-white dark:bg-[#1A1A35] text-xs outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#4B5563] dark:text-[#C4B5FD]">Badge/Chip Theme Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={newBadgeColor}
                    onChange={(e) => setNewBadgeColor(e.target.value)}
                    className="w-10 h-10 border border-[#DDD6FE]/40 rounded-xl cursor-pointer p-0 bg-transparent shrink-0"
                    title="Choose Badge Palette"
                  />
                  <input
                    type="text"
                    value={newBadgeColor}
                    onChange={(e) => setNewBadgeColor(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#DDD6FE]/40 bg-white dark:bg-[#1A1A35] text-xs outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#4B5563] dark:text-[#C4B5FD]">Cashback / Discount Offer Details</label>
              <input
                type="text"
                placeholder="e.g. 10% Instant Discount up to ₹1,500"
                value={newOfferText}
                onChange={(e) => setNewOfferText(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#DDD6FE]/40 bg-white dark:bg-[#1A1A35] text-xs outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-4 items-end">
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-xs font-bold text-[#4B5563] dark:text-[#C4B5FD]">Minimum Order Value (₹)</label>
                <input
                  type="number"
                  value={newMinOrder}
                  onChange={(e) => setNewMinOrder(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#DDD6FE]/40 bg-white dark:bg-[#1A1A35] text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                className="h-10 px-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-sm transition-all"
              >
                <Plus size={14} /> Add Card Offer
              </button>
            </div>
          </form>

          {/* List display */}
          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-black text-[#9CA3AF] uppercase tracking-wider">
              Active Credit/Debit Card Promos ({bankOffers.length})
            </span>

            <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1">
              {bankOffers.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-[#DDD6FE]/60 dark:border-white/10 rounded-2xl text-xs text-[#9CA3AF] font-semibold bg-[#EEF0F8]/20">
                  No active card cashback offers created yet.
                </div>
              ) : (
                bankOffers.map((offer, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 border border-[#DDD6FE]/30 dark:border-white/5 bg-[#EEF0F8]/30 dark:bg-[#1A1A35]/30 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3.5 h-3.5 rounded-full border border-white dark:border-[#141428] shadow shrink-0" 
                        style={{ backgroundColor: offer.badgeColor }} 
                      />
                      <div className="flex flex-col min-w-0">
                        <strong className="text-xs text-[#1E1B4B] dark:text-white font-extrabold truncate w-44">{offer.bank}</strong>
                        <span className="text-[11px] text-[#9CA3AF] mt-0.5">{offer.offer} (Min Order: ₹{offer.minOrder})</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBankOffer(idx)}
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg cursor-pointer border-none bg-transparent transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminSeasonalTab;
