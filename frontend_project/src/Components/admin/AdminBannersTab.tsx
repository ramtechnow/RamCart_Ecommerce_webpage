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
  const [uploading, setUploading] = useState(false);

  const [description, setDescription] = useState('');
  const [targetLink, setTargetLink] = useState('');
  const [targetProductId, setTargetProductId] = useState('');
  const [discountType, setDiscountType] = useState<string>('none');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [page, setPage] = useState<string>('home');

  const [saving, setSaving] = useState(false);
  const [busyBannerId, setBusyBannerId] = useState<string | null>(null);

  // Edit banner modal state
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editTargetLink, setEditTargetLink] = useState('');
  const [editDiscountType, setEditDiscountType] = useState('none');
  const [editDiscountValue, setEditDiscountValue] = useState('');
  const [editPage, setEditPage] = useState('home');
  const [editImageUrl, setEditImageUrl] = useState('');

  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
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
        setProducts(list.map((p: any) => ({ id: String(p.id), name: p.name })));
      })
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, []);

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setTargetProductId(val);
    setTargetLink(val ? `/product/${val}` : '');
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
          const max_size = 1400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
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
      if (isEdit) {
        setEditImageUrl(base64Data);
      } else {
        setImageUrl(base64Data);
        setImagePreview(base64Data);
      }
      addToast('🖼️ Banner image uploaded & compressed successfully', 'info');
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
        discountType: discountType === 'none' ? null : discountType,
        discountValue: discountType === 'none' ? 0 : Number(discountValue || 0),
        page
      });

      addToast('🎉 Promotional banner published successfully!', 'success');
      logAction(`Created new promo banner for ${page} page`);

      clearImage();
      setDescription('');
      setTargetLink('');
      setTargetProductId('');
      setDiscountType('none');
      setDiscountValue('');
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
    setEditTargetLink(b.targetLink || '');
    setEditDiscountType(b.discountType || 'none');
    setEditDiscountValue(b.discountValue ? String(b.discountValue) : '');
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
        discountType: editDiscountType === 'none' ? null : editDiscountType,
        discountValue: editDiscountType === 'none' ? 0 : Number(editDiscountValue || 0),
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
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-xs font-extrabold text-[#0f0e17] dark:text-white line-clamp-1">
                      {b.description}
                    </h4>
                    {b.discountType && (
                      <span className="bg-[#eff0f6] text-[#e53170] text-[9px] font-black px-2 py-0.5 rounded-full shrink-0">
                        {b.discountType === 'percentage' ? `${b.discountValue}% OFF` : `₹${b.discountValue} OFF`}
                      </span>
                    )}
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
                    <div className="relative w-full h-24 rounded-lg overflow-hidden border border-[#e2e4ed]/40">
                      <img src={imageUrl || imagePreview} alt="Banner uploader preview" className="w-full h-full object-cover" />
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

              {/* Click Target selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be]">Target Destination Link</label>
                <select 
                  value={targetProductId} 
                  onChange={handleProductSelect}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-[#e2e4ed]/40 bg-[#ffffff] dark:bg-[#212030] outline-none cursor-pointer"
                  disabled={loadingProducts}
                >
                  <option value="">{loadingProducts ? 'Syncing Catalog...' : '— Select target product —'}</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
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
                <img src={editImageUrl} alt="Edit preview" className="w-full h-28 object-cover rounded-xl border border-[#e2e4ed]/40 mb-2 bg-gray-100" />
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
