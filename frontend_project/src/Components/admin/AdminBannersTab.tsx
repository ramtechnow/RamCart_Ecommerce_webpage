import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Loader2, ToggleLeft, ToggleRight, Upload, Edit3, X, Check, Link as LinkIcon, Plus } from 'lucide-react';
import { adminApi } from '../../Utils/adminApi';
import { BACKEND_URL } from '../../config';

interface AdminBannersTabProps {
  banners: any[];
  onRefreshBanners: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  triggerConfirm: (config: any) => void;
  logAction: (action: string) => void;
}

export const AdminBannersTab: React.FC<AdminBannersTabProps> = ({
  banners = [],
  onRefreshBanners,
  addToast,
  triggerConfirm,
  logAction
}) => {
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [imageSizeKb, setImageSizeKb] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('EARLY BIRD DEALS');
  const [bankOfferText, setBankOfferText] = useState('Instant Discount on Prepaid Orders*');
  const [targetLink, setTargetLink] = useState('');
  const [targetProductId, setTargetProductId] = useState('');
  const [discountType, setDiscountType] = useState<string>('none');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [couponCode, setCouponCode] = useState<string>('');
  const [page, setPage] = useState<string>('home');

  const [saving, setSaving] = useState(false);
  const [busyBannerId, setBusyBannerId] = useState<string | null>(null);

  // Edit banner modal state
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editTag, setEditTag] = useState('');
  const [editBankOfferText, setEditBankOfferText] = useState('');
  const [editTargetLink, setEditTargetLink] = useState('');
  const [editDiscountType, setEditDiscountType] = useState('none');
  const [editDiscountValue, setEditDiscountValue] = useState('');
  const [editCouponCode, setEditCouponCode] = useState('');
  const [editPage, setEditPage] = useState('home');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editTargetProductId, setEditTargetProductId] = useState('');
  const [editImageSizeKb, setEditImageSizeKb] = useState<number | null>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Load product list for the destination dropdown
  useEffect(() => {
    setLoadingProducts(true);
    fetch(`${BACKEND_URL}/allproducts`)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.products || []);
        setProducts(list.map((p: any) => ({
          id: String(p.id),
          name: p.name,
          new_price: Number(p.new_price ?? p.newPrice ?? 0),
          old_price: Number(p.old_price ?? p.oldPrice ?? 0),
          image: p.image || '',
          category: p.category || ''
        })));
      })
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, []);

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setTargetProductId(val);
    setTargetLink(val ? `/product/${val}` : '');
    if (!val) return;

    const matched = products.find(p => p.id === val);
    if (matched) {
      const oldPrice = Number(matched.old_price) || 0;
      const newPrice = Number(matched.new_price) || 0;
      let calculatedPct = 0;
      if (oldPrice > 0 && newPrice > 0 && oldPrice > newPrice) {
        calculatedPct = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
      }

      if (calculatedPct > 0) {
        setDiscountType('percentage');
        setDiscountValue(String(calculatedPct));
        setTag(`FLAT ${calculatedPct}% OFF`);
        setDescription(`Special Deal: ${matched.name} now at ₹${newPrice} (was ₹${oldPrice})`);
      } else if (newPrice > 0) {
        setDiscountType('none');
        setDiscountValue('');
        setDescription(`Featured Collection: ${matched.name} - Only ₹${newPrice}`);
      }

      if (matched.category) {
        const cat = matched.category.toLowerCase();
        if (cat === 'men' || cat === 'mens') setPage('men');
        else if (cat === 'women' || cat === 'womens') setPage('women');
        else if (cat === 'kid' || cat === 'kids') setPage('kids');
      }

      // Auto-preview product photo if banner is currently empty
      if (!imageUrl && matched.image) {
        setImageUrl(matched.image);
        setImagePreview(matched.image);
      }
    }
  };

  const handleUseProductPhoto = (isEdit = false) => {
    const pId = isEdit ? editTargetProductId : targetProductId;
    const matched = products.find(p => p.id === pId);
    if (!matched?.image) {
      addToast('Please select a product first or product has no photo', 'warning');
      return;
    }
    if (isEdit) {
      setEditImageUrl(matched.image);
      setEditImageSizeKb(null);
    } else {
      setImageUrl(matched.image);
      setImagePreview(matched.image);
      setImageSizeKb(null);
    }
    addToast('📸 Applied selected product image to banner', 'info');
  };

  const compressBannerImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Standard widescreen 1280x600 banner format
          const targetW = 1280;
          const targetH = 600;
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Draw image covering 1280x600 container cleanly (object-fit: cover)
            const imgAspect = img.width / img.height;
            const targetAspect = targetW / targetH;
            let renderW = targetW;
            let renderH = targetH;
            let offsetX = 0;
            let offsetY = 0;

            if (imgAspect > targetAspect) {
              renderH = targetH;
              renderW = targetH * imgAspect;
              offsetX = (targetW - renderW) / 2;
            } else {
              renderW = targetW;
              renderH = targetW / imgAspect;
              offsetY = (targetH - renderH) / 2;
            }

            ctx.fillStyle = '#121214';
            ctx.fillRect(0, 0, targetW, targetH);
            ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
          }
          const dataUrl = canvas.toDataURL('image/jpeg', 0.76);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file (JPG, PNG, WebP)', 'warning');
      return;
    }

    setUploading(true);
    try {
      const base64Data = await compressBannerImage(file);
      const sizeKb = Math.round((base64Data.length * 3 / 4) / 1024);
      if (isEdit) {
        setEditImageUrl(base64Data);
        setEditImageSizeKb(sizeKb);
      } else {
        setImageUrl(base64Data);
        setImagePreview(base64Data);
        setImageSizeKb(sizeKb);
      }
      addToast(`🖼️ Banner resized (1280x600) & compressed to ${sizeKb} KB!`, 'info');
    } catch (err) {
      console.error(err);
      addToast('Failed to process image file', 'error');
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setImageUrl('');
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const finalImageUrl = imageUrl || imagePreview;
    if (!finalImageUrl) {
      addToast('Please upload a banner image file', 'warning');
      return;
    }
    if (!description.trim()) {
      addToast('Please enter an overlay description text', 'warning');
      return;
    }
    if (!targetLink.trim()) {
      addToast('Please select a destination product or type a link', 'warning');
      return;
    }

    setSaving(true);
    try {
      await adminApi.createBanner({
        image: finalImageUrl,
        description: description.trim(),
        targetLink: targetLink.trim(),
        tag: tag.trim() || 'EARLY BIRD DEALS',
        bankOfferText: bankOfferText.trim() || 'Instant Discount on Prepaid Orders*',
        discountType: discountType === 'none' ? null : discountType,
        discountValue: discountType === 'none' ? 0 : Number(discountValue || 0),
        couponCode: couponCode.trim().toUpperCase(),
        page
      });

      addToast('🎉 Promotional banner published successfully!', 'success');
      logAction(`Created new promo banner for ${page} page`);

      clearImage();
      setDescription('');
      setTag('EARLY BIRD DEALS');
      setBankOfferText('Instant Discount on Prepaid Orders*');
      setTargetLink('');
      setTargetProductId('');
      setDiscountType('none');
      setDiscountValue('');
      setCouponCode('');
      setPage('home');

      onRefreshBanners();
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Failed to create banner', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (b: any) => {
    setEditingBanner(b);
    setEditDescription(b.description || '');
    setEditTag(b.tag || 'EARLY BIRD DEALS');
    setEditBankOfferText(b.bankOfferText || 'Instant Discount on Prepaid Orders*');
    setEditTargetLink(b.targetLink || '');
    setEditDiscountType(b.discountType || 'none');
    setEditDiscountValue(b.discountValue ? String(b.discountValue) : '');
    setEditCouponCode(b.couponCode || '');
    setEditPage(b.page || 'home');
    setEditImageUrl(b.image || '');
  };

  const handleSaveEditedBanner = async () => {
    if (!editingBanner) return;
    setSaving(true);
    try {
      await adminApi.updateBanner(editingBanner._id, {
        image: editImageUrl,
        description: editDescription,
        targetLink: editTargetLink,
        tag: editTag.trim() || 'EARLY BIRD DEALS',
        bankOfferText: editBankOfferText.trim() || 'Instant Discount on Prepaid Orders*',
        discountType: editDiscountType === 'none' ? null : editDiscountType,
        discountValue: editDiscountType === 'none' ? 0 : Number(editDiscountValue || 0),
        couponCode: editCouponCode.trim().toUpperCase(),
        page: editPage
      });

      addToast('🎉 Banner updated successfully!', 'success');
      logAction(`Updated hero banner #${editingBanner._id}`);
      setEditingBanner(null);
      onRefreshBanners();
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Failed to update banner', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBanner = async (bannerId: string, currentStatus: boolean) => {
    setBusyBannerId(bannerId);
    try {
      await adminApi.toggleBanner(bannerId, !currentStatus);
      addToast('🎉 Banner status updated', 'success');
      logAction(`Toggled banner ${bannerId} active status to ${!currentStatus}`);
      onRefreshBanners();
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Failed to toggle banner status', 'error');
    } finally {
      setBusyBannerId(null);
    }
  };

  const handleDeleteBanner = (banner: any) => {
    triggerConfirm({
      title: 'Delete Promotional Banner?',
      message: `Are you sure you want to permanently delete this banner? It will immediately stop showing on the ${banner.page} page.`,
      isDestructive: true,
      confirmText: 'Delete Banner',
      onConfirm: async () => {
        try {
          await adminApi.deleteBanner(banner._id);
          addToast('🎉 Banner deleted successfully!', 'success');
          logAction(`Deleted banner on ${banner.page}`);
          onRefreshBanners();
        } catch (err: any) {
          console.error(err);
          addToast(err.message || 'Failed to delete banner', 'error');
        }
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full text-[#0f0e17] dark:text-[#fffffe]">
      {/* Header Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight">Hero Banners Manager</h2>
        <p className="text-sm text-[#717388] mt-0.5">Manage promotional sliders and highlight campaigns.</p>
      </div>

      {/* Bento Grid layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Side: Active Banners Grid */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          <h3 className="text-xs font-black text-[#e53170] dark:text-[#ff8906] uppercase tracking-wider border-b border-[#e2e4ed]/20 dark:border-white/5 pb-2">
            Active Storefront Banners
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners.map((b) => (
              <div 
                key={b._id} 
                className="bg-[#ffffff] dark:bg-[#171622] rounded-2xl overflow-hidden shadow-sm border border-[#e2e4ed]/40 dark:border-white/10 flex flex-col group hover:shadow-md transition-shadow duration-200"
              >
                {/* Widescreen image box */}
                <div className="h-44 w-full relative bg-[#eff0f6] dark:bg-[#212030]">
                  <img src={b.image} alt={b.description} className="w-full h-full object-cover" />
                  
                  {/* Page Indicator Tag */}
                  <span className="absolute top-3 left-3 bg-[#0f0e17]/85 text-white px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                    {b.page} Page Slider
                  </span>

                  {/* Active status indicator badge */}
                  <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm ${
                    b.isActive 
                      ? "bg-green-500 text-white" 
                      : "bg-[#717388] text-white"
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                    {b.isActive ? 'Active' : 'Disabled'}
                  </div>
                </div>

                {/* Info and Actions */}
                <div className="p-4 flex flex-col flex-1 gap-2 bg-[#eff0f6]/20 dark:bg-[#212030]/20">
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <h4 className="text-xs font-extrabold text-[#0f0e17] dark:text-white line-clamp-1">
                      {b.description}
                    </h4>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-500/20">
                        {b.tag || "EARLY BIRD DEALS"}
                      </span>
                      {b.discountType && (
                        <span className="bg-[#eff0f6] text-[#e53170] text-[9px] font-black px-2 py-0.5 rounded-full">
                          {b.discountType === 'percentage' ? `${b.discountValue}% OFF` : `₹${b.discountValue} OFF`}
                        </span>
                      )}
                      {b.couponCode && (
                        <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                          🏷️ {b.couponCode}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[10px] text-[#717388] font-semibold flex items-center gap-1 mt-1 truncate">
                    <LinkIcon size={12} className="text-[#ff8906]" />
                    <span>Redirects to: {b.targetLink}</span>
                  </p>

                  {/* Action buttons footer inside card */}
                  <div className="mt-3 pt-3 border-t border-[#e2e4ed]/20 dark:border-white/5 flex items-center justify-between">
                    <button
                      type="button"
                      disabled={busyBannerId === b._id}
                      onClick={() => handleToggleBanner(b._id, b.isActive)}
                      className={`flex items-center gap-1 text-[11px] font-black border-none bg-transparent cursor-pointer disabled:opacity-50 transition-colors ${
                        b.isActive ? "text-[#388E3C]" : "text-[#717388]"
                      }`}
                    >
                      {b.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      <span>{b.isActive ? 'Disable' : 'Enable'}</span>
                    </button>

                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(b)}
                        className="px-2.5 py-1.5 border border-[#e2e4ed]/60 dark:border-white/10 hover:bg-[#e6e8eb] dark:hover:bg-[#363636] text-[#2e2f3e] dark:text-[#a7a9be] text-[10px] font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer bg-[#ffffff] dark:bg-[#171622]"
                      >
                        <Edit3 size={11} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBanner(b)}
                        className="px-2.5 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 text-[10px] font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer border-none"
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {banners.length === 0 && (
              <div className="col-span-full p-12 text-center text-xs font-semibold text-[#717388] bg-[#ffffff] dark:bg-[#171622] rounded-2xl border border-[#e2e4ed]/30 dark:border-white/5">
                No hero banners published yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Draft New Banner Form */}
        <div className="xl:col-span-1">
          <div className="bg-[#ffffff] dark:bg-[#171622] rounded-2xl shadow-sm border border-[#e2e4ed]/40 dark:border-white/10 p-6 flex flex-col gap-4 sticky top-24 transition-colors duration-200">
            <h3 className="text-xs font-black text-[#e53170] dark:text-[#ff8906] uppercase tracking-wider flex items-center gap-2 border-b border-[#e2e4ed]/20 dark:border-white/5 pb-3">
              <Plus size={16} /> Draft New Banner
            </h3>

            <form onSubmit={handleCreateBanner} className="flex flex-col gap-4">
              {/* Image Upload Zone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be]">Banner Widescreen Image</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#e2e4ed]/60 dark:border-white/10 rounded-xl p-5 text-center bg-[#eff0f6]/20 dark:bg-[#212030]/20 hover:bg-[#e6e8eb] dark:hover:bg-[#363636] transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, false)}
                    className="hidden"
                  />

                  {uploading ? (
                    <div className="flex items-center justify-center gap-2 py-4">
                      <Loader2 size={18} className="animate-spin text-[#ff8906]" />
                      <span className="text-xs font-bold">Uploading file...</span>
                    </div>
                  ) : (imageUrl || imagePreview) ? (
                    <div className="relative w-full h-28 rounded-lg overflow-hidden border border-[#e2e4ed]/40">
                      <img src={imageUrl || imagePreview} alt="Banner uploader preview" className="w-full h-full object-cover" />
                      {imageSizeKb && (
                        <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          📁 {imageSizeKb} KB (Fast Load)
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); clearImage(); }}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 border-none cursor-pointer"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 py-4">
                      <Upload size={24} className="text-[#ff8906]" />
                      <span className="text-xs font-bold text-[#0f0e17] dark:text-white">Click to upload banner</span>
                      <span className="text-[10px] text-[#717388] font-semibold">Widescreen 1400x450 recommended</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Title / Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be]">Overlay Banner Title</label>
                <input
                  type="text"
                  placeholder="e.g. End of Season Sale &bull; Up to 50% Off"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-[#e2e4ed]/40 bg-[#ffffff] dark:bg-[#212030] outline-none"
                />
              </div>

              {/* Carousel Badge Tag */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be]">Carousel Badge Tag</label>
                <input
                  type="text"
                  placeholder="e.g. EARLY BIRD DEALS, RAMCART EXCLUSIVE, FESTIVE DROP"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-[#e2e4ed]/40 bg-[#ffffff] dark:bg-[#212030] outline-none"
                />
              </div>

              {/* Bank Offer Strip Text */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be]">Bank / Payment Offer Subtext</label>
                <input
                  type="text"
                  placeholder="e.g. Instant Discount on Prepaid Orders*"
                  value={bankOfferText}
                  onChange={(e) => setBankOfferText(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-[#e2e4ed]/40 bg-[#ffffff] dark:bg-[#212030] outline-none"
                />
              </div>

              {/* Click Target selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be]">Target Destination Link</label>
                <select 
                  value={targetProductId} 
                  onChange={handleProductSelect}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-[#e2e4ed]/40 bg-[#ffffff] dark:bg-[#212030] outline-none cursor-pointer"
                  disabled={loadingProducts}
                >
                  <option value="">{loadingProducts ? 'Syncing Catalog...' : '— Select target product (Auto-Calculates Real Discount) —'}</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.old_price && p.new_price && p.old_price > p.new_price ? `(${Math.round(((p.old_price - p.new_price) / p.old_price) * 100)}% OFF • ₹${p.new_price})` : `(₹${p.new_price || 0})`}
                    </option>
                  ))}
                </select>
                {targetProductId && (
                  <button
                    type="button"
                    onClick={() => handleUseProductPhoto(false)}
                    className="self-start text-[11px] font-bold text-black dark:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 cursor-pointer flex items-center gap-1 transition-colors mt-1"
                  >
                    <span>📸 Use Selected Product's Photo as Banner</span>
                  </button>
                )}
              </div>

              {/* Placement */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be]">Page Placement Slider</label>
                <select 
                  value={page} 
                  onChange={(e) => setPage(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-[#e2e4ed]/40 bg-[#ffffff] dark:bg-[#212030] outline-none cursor-pointer"
                >
                  <option value="home">Home Page Hero</option>
                  <option value="men">Men's Category</option>
                  <option value="women">Women's Category</option>
                  <option value="kids">Kids' Category</option>
                </select>
              </div>

              {/* Discount Tag type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be]">Promotional Discount Tag</label>
                <select 
                  value={discountType} 
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-[#e2e4ed]/40 bg-[#ffffff] dark:bg-[#212030] outline-none cursor-pointer"
                >
                  <option value="none">No Offer tag</option>
                  <option value="percentage">Percentage Discount (%)</option>
                  <option value="flat">Flat Amount Discount (₹)</option>
                </select>
              </div>

              {/* Discount value if active */}
              {discountType !== 'none' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be]">
                    Discount Value {discountType === 'percentage' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    placeholder={discountType === 'percentage' ? 'e.g. 20' : 'e.g. 400'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-[#e2e4ed]/40 bg-[#ffffff] dark:bg-[#212030] outline-none"
                  />
                </div>
              )}

              {/* Promo Coupon Code Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be] flex items-center justify-between">
                  <span>Carousel Coupon Code</span>
                  <span className="text-[10px] font-normal text-[#717388]">Optional (e.g. DIWALI50, SAVE20)</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter custom coupon code (leave empty for none)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full h-10 px-3 text-xs font-mono font-bold tracking-wider uppercase rounded-xl border border-[#e2e4ed]/40 bg-[#ffffff] dark:bg-[#212030] outline-none"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={saving || uploading}
                className="w-full mt-2 py-2.5 px-4 bg-[#ff8906] hover:bg-[#e53170] text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#ff8906]/20 disabled:opacity-50 border-none transition-all duration-150 text-xs"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                <span>Publish Promo Banner</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Banner Dialog Modal */}
      {editingBanner && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#ffffff] dark:bg-[#171622] rounded-2xl border border-[#e2e4ed]/40 dark:border-white/10 p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#e2e4ed]/20 dark:border-white/5 pb-3">
              <h3 className="text-sm font-black text-[#e53170] dark:text-[#ff8906] uppercase tracking-wider">Edit Banner Specifications</h3>
              <button 
                onClick={() => setEditingBanner(null)} 
                className="text-[#717388] hover:text-[#2e2f3e] cursor-pointer bg-transparent border-none p-0"
              >
                <X size={18}/>
              </button>
            </div>

            <div className="flex flex-col gap-3.5">
              {/* Image */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be]">Banner Image</label>
                <div className="relative w-full h-28 rounded-xl overflow-hidden border border-[#e2e4ed]/40 mb-2 bg-gray-100">
                  <img src={editImageUrl} alt="Edit preview" className="w-full h-full object-cover" />
                  {editImageSizeKb && (
                    <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      📁 {editImageSizeKb} KB (Optimized)
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => editFileInputRef.current?.click()}
                  className="self-start px-3 py-1.5 border border-[#e2e4ed]/60 dark:border-white/10 hover:bg-[#e6e8eb] dark:hover:bg-[#363636] text-[#2e2f3e] dark:text-[#a7a9be] text-xs font-bold rounded-lg cursor-pointer bg-[#ffffff] dark:bg-[#171622]"
                >
                  Replace image file
                </button>
                <input ref={editFileInputRef} type="file" accept="image/*" onChange={(e) => handleFileSelect(e, true)} className="hidden" />
              </div>

              {/* Title Description */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be]">Overlay Description</label>
                <input 
                  type="text" 
                  value={editDescription} 
                  onChange={(e) => setEditDescription(e.target.value)} 
                  className="w-full h-9 px-3 rounded-lg border border-[#e2e4ed]/40 bg-[#ffffff] dark:bg-[#212030] outline-none text-xs"
                />
              </div>

              {/* Badge Tag */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be]">Carousel Badge Tag</label>
                <input 
                  type="text" 
                  value={editTag} 
                  onChange={(e) => setEditTag(e.target.value)} 
                  placeholder="e.g. EARLY BIRD DEALS"
                  className="w-full h-9 px-3 rounded-lg border border-[#e2e4ed]/40 bg-[#ffffff] dark:bg-[#212030] outline-none text-xs"
                />
              </div>

              {/* Bank Offer Strip Text */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be]">Bank / Payment Offer Subtext</label>
                <input 
                  type="text" 
                  value={editBankOfferText} 
                  onChange={(e) => setEditBankOfferText(e.target.value)} 
                  placeholder="e.g. Instant Discount on Prepaid Orders*"
                  className="w-full h-9 px-3 rounded-lg border border-[#e2e4ed]/40 bg-[#ffffff] dark:bg-[#212030] outline-none text-xs"
                />
              </div>

              {/* Target Product Selection */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be]">Sync With Target Product</label>
                <select
                  value={editTargetProductId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditTargetProductId(val);
                    setEditTargetLink(val ? `/product/${val}` : '');
                    const matched = products.find(p => p.id === val);
                    if (matched) {
                      const oldPrice = Number(matched.old_price) || 0;
                      const newPrice = Number(matched.new_price) || 0;
                      if (oldPrice > 0 && newPrice > 0 && oldPrice > newPrice) {
                        const pct = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
                        setEditDiscountType('percentage');
                        setEditDiscountValue(String(pct));
                        setEditTag(`FLAT ${pct}% OFF`);
                        setEditDescription(`Special Deal: ${matched.name} now at ₹${newPrice}`);
                      }
                    }
                  }}
                  className="w-full h-9 px-3 rounded-lg border border-[#e2e4ed]/40 bg-[#ffffff] dark:bg-[#212030] outline-none text-xs cursor-pointer"
                >
                  <option value="">— Select Product (Auto-Recalculate) —</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {editTargetProductId && (
                  <button
                    type="button"
                    onClick={() => handleUseProductPhoto(true)}
                    className="self-start text-[10px] font-bold text-black dark:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer mt-1"
                  >
                    <span>📸 Use Selected Product's Photo</span>
                  </button>
                )}
              </div>

              {/* Target Redirect */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be]">Target Link</label>
                <input 
                  type="text" 
                  value={editTargetLink} 
                  onChange={(e) => setEditTargetLink(e.target.value)} 
                  className="w-full h-9 px-3 rounded-lg border border-[#e2e4ed]/40 bg-[#ffffff] dark:bg-[#212030] outline-none text-xs"
                />
              </div>

              {/* Placement */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be]">Placement</label>
                <select 
                  value={editPage} 
                  onChange={(e) => setEditPage(e.target.value)} 
                  className="w-full h-9 px-3 rounded-lg border border-[#e2e4ed]/40 bg-[#ffffff] dark:bg-[#212030] outline-none text-xs cursor-pointer"
                >
                  <option value="home">Home Page Hero</option>
                  <option value="men">Men's Category</option>
                  <option value="women">Women's Category</option>
                  <option value="kids">Kids' Category</option>
                </select>
              </div>

              {/* Promo tags */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be]">Promo Offer Tag</label>
                <select 
                  value={editDiscountType} 
                  onChange={(e) => setEditDiscountType(e.target.value)} 
                  className="w-full h-9 px-3 rounded-lg border border-[#e2e4ed]/40 bg-[#ffffff] dark:bg-[#212030] outline-none text-xs cursor-pointer"
                >
                  <option value="none">No Offer tag</option>
                  <option value="percentage">Percentage Discount (%)</option>
                  <option value="flat">Flat Amount Discount (₹)</option>
                </select>
              </div>

              {/* Discount Value */}
              {editDiscountType !== 'none' && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be]">
                    Discount Value {editDiscountType === 'percentage' ? '(%)' : '(₹)'}
                  </label>
                  <input 
                    type="number" 
                    value={editDiscountValue} 
                    onChange={(e) => setEditDiscountValue(e.target.value)} 
                    className="w-full h-9 px-3 rounded-lg border border-[#e2e4ed]/40 bg-[#ffffff] dark:bg-[#212030] outline-none text-xs"
                  />
                </div>
              )}

              {/* Edit Promo Coupon Code Field */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be] flex items-center justify-between">
                  <span>Carousel Coupon Code</span>
                  <span className="text-[10px] font-normal text-[#717388]">Editable (e.g. DIWALI50, SAVE20)</span>
                </label>
                <input 
                  type="text" 
                  placeholder="Enter custom coupon code (leave empty for none)"
                  value={editCouponCode} 
                  onChange={(e) => setEditCouponCode(e.target.value.toUpperCase())} 
                  className="w-full h-9 px-3 uppercase font-mono font-bold tracking-wider rounded-lg border border-[#e2e4ed]/40 bg-[#ffffff] dark:bg-[#212030] outline-none text-xs"
                />
              </div>

              {/* Modal controls */}
              <div className="flex gap-3 mt-4 border-t border-[#e2e4ed]/20 dark:border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingBanner(null)}
                  className="flex-1 py-2 rounded-xl border border-[#e2e4ed]/60 dark:border-white/10 text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be] hover:bg-[#eff0f6] cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveEditedBanner}
                  className="flex-1 py-2 bg-[#ff8906] hover:bg-[#e53170] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-[#ff8906]/20 border-none"
                >
                  {saving ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} 
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminBannersTab;
