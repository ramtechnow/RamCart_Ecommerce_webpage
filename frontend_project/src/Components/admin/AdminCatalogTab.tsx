import React, { useState, useMemo, ChangeEvent } from 'react';
import { Pencil, Trash2, X, Search, Filter, Loader2, Plus, AlertTriangle, Check } from 'lucide-react';
import { adminApi } from '../../Utils/adminApi';
import { compressImageToBase64, normalizeCategory } from '../../Utils/adminHelpers';
import { Product, ProductVariant } from '../../features/catalog/types/productTypes';

interface AdminCatalogTabProps {
  products: Product[];
  onRefreshProducts: () => void;
  addToast: (message: string, type: "success" | "error" | "info" | "warning") => void;
  triggerConfirm: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => void;
  logAction: (message: string) => void;
}

interface EditFormState {
  id: string;
  name: string;
  category: string;
  newPrice: number;
  oldPrice: number;
  variants: ProductVariant[];
  image: string;
  images: string[];
  colors: string[];
  sizes: string[];
  description: string;
}

export const AdminCatalogTab: React.FC<AdminCatalogTabProps> = ({
  products = [],
  onRefreshProducts,
  addToast,
  triggerConfirm,
  logAction
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all"); // "all" | "low" | "ok"

  // Editing Product Inline State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);

  // Loaders
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [busyStockKeys, setBusyStockKeys] = useState<Record<string, boolean>>({});

  // Filtered list
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const nameMatch = prod.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      let catMatch = true;
      if (categoryFilter !== 'all') {
        const prodCat = prod.category?.toLowerCase() || '';
        const filterCat = categoryFilter.toLowerCase();
        if (filterCat === 'kids') {
          catMatch = prodCat === 'kid' || prodCat === 'kids';
        } else {
          catMatch = prodCat === filterCat;
        }
      }

      let stockMatch = true;
      if (stockFilter === 'low') {
        stockMatch = (prod.stockCount ?? 0) < 10;
      } else if (stockFilter === 'ok') {
        stockMatch = (prod.stockCount ?? 0) >= 10;
      }
      
      return nameMatch && catMatch && stockMatch;
    });
  }, [products, searchQuery, categoryFilter, stockFilter]);

  // Edit Handlers
  const syncVariants = (
    updatedColors: string[],
    updatedSizes: string[],
    currentVariants: ProductVariant[],
    category: string,
    name: string,
    price: number
  ) => {
    const list: ProductVariant[] = [];
    const baseSlugName = name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '-')
      .substring(0, 15) || "ITEM";

    updatedColors.forEach(color => {
      updatedSizes.forEach(size => {
        const existing = currentVariants.find(
          v => v.color.toLowerCase() === color.toLowerCase() && v.size.toLowerCase() === size.toLowerCase()
        );
        if (existing) {
          list.push(existing);
        } else {
          list.push({
            sku: `RC-${category.substring(0, 3).toUpperCase()}-${baseSlugName}-${color.toUpperCase()}-${size}`,
            color,
            size,
            stock: 50,
            price: price
          });
        }
      });
    });
    return list;
  };

  const startEditing = (prod: Product) => {
    setEditingProductId(prod.id);
    
    let initialVariants: ProductVariant[] = prod.variants ? JSON.parse(JSON.stringify(prod.variants)) : [];
    if (initialVariants.length === 0) {
      const colors = prod.colors && prod.colors.length > 0 ? prod.colors : ['Black', 'White'];
      const sizes = prod.sizes && prod.sizes.length > 0 ? prod.sizes : ['S', 'M', 'L'];
      const totalStock = prod.stockCount !== undefined ? prod.stockCount : 100;
      const stockPerVariant = Math.floor(totalStock / (colors.length * sizes.length || 1));
      
      colors.forEach((c) => {
        sizes.forEach((s) => {
          initialVariants.push({
            sku: `RC-${prod.category?.toUpperCase() || "CAT"}-${prod.name.toUpperCase().substring(0, 8).replace(/\s/g, '-')}-${c.toUpperCase()}-${s}`,
            size: s,
            color: c,
            stock: stockPerVariant,
            price: prod.newPrice || 0
          });
        });
      });
    }

    setEditForm({
      id: prod.id,
      name: prod.name,
      category: prod.category || "women",
      newPrice: prod.newPrice,
      oldPrice: prod.oldPrice || prod.newPrice * 1.5,
      variants: initialVariants,
      image: prod.image || "",
      images: prod.images || (prod.image ? [prod.image] : []),
      colors: prod.colors || [],
      sizes: prod.sizes || [],
      description: prod.description || ""
    });
  };

  const handleVariantFieldChange = (idx: number, field: keyof ProductVariant, value: any) => {
    if (!editForm) return;
    const updatedVariants = [...editForm.variants];
    updatedVariants[idx] = { ...updatedVariants[idx], [field]: value };
    setEditForm({ ...editForm, variants: updatedVariants });
  };

  const handleAddImage = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!editForm || !e.target.files) return;
    const files = e.target.files;
    const loadedImages: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const base64 = await compressImageToBase64(files[i]) as string;
        loadedImages.push(base64);
      } catch (err) {
        console.error("Compression failed:", err);
      }
    }

    if (loadedImages.length > 0) {
      if (replaceIndex !== null) {
        const updated = [...editForm.images];
        updated[replaceIndex] = loadedImages[0];
        setEditForm({
          ...editForm,
          images: updated,
          image: replaceIndex === 0 ? loadedImages[0] : editForm.image
        });
        setReplaceIndex(null);
        addToast("Image replaced successfully!", "success");
      } else {
        setEditForm({
          ...editForm,
          images: [...editForm.images, ...loadedImages],
          image: editForm.image || loadedImages[0]
        });
        addToast("Image added successfully!", "success");
      }
    }
  };

  const handleReplaceClick = (idx: number) => {
    setReplaceIndex(idx);
    document.getElementById(`edit-image-input-file-${editForm?.id}`)?.click();
  };

  const handleDeleteImage = (idx: number) => {
    if (!editForm) return;
    const updated = editForm.images.filter((_, index) => index !== idx);
    setEditForm({
      ...editForm,
      images: updated,
      image: idx === 0 ? (updated[0] || "") : editForm.image
    });
    addToast("Image removed", "info");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm) return;
    if (!editForm.name.trim()) {
      addToast("Product title cannot be empty", "error");
      return;
    }
    if (Number(editForm.newPrice) <= 0) {
      addToast("Price must be greater than 0", "error");
      return;
    }

    setSavingProductId(id);
    const calculatedStock = editForm.variants.reduce((sum, v) => sum + v.stock, 0);

    const payload = {
      id: editForm.id,
      name: editForm.name,
      category: editForm.category,
      newPrice: Number(editForm.newPrice),
      oldPrice: Number(editForm.oldPrice),
      variants: editForm.variants,
      stockCount: calculatedStock,
      image: editForm.images[0] || "",
      images: editForm.images,
      colors: editForm.colors,
      sizes: editForm.sizes,
      description: editForm.description
    };

    try {
      await adminApi.updateProduct(payload);
      addToast("🎉 Product successfully updated!", "success");
      logAction(`Updated product specifications: "${editForm.name}"`);
      setEditingProductId(null);
      onRefreshProducts();
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Failed to update product details", "error");
    } finally {
      setSavingProductId(null);
    }
  };

  const handleDeleteProduct = (prod: Product) => {
    triggerConfirm({
      title: "Delete Product Listing?",
      message: `Are you sure you want to permanently remove "${prod.name}" from the store catalog? This action cannot be undone.`,
      isDestructive: true,
      confirmText: "Delete Product",
      onConfirm: async () => {
        try {
          await adminApi.removeProduct(prod.id);
          addToast("🎉 Product deleted successfully!", "success");
          logAction(`Deleted product from catalog: "${prod.name}"`);
          onRefreshProducts();
        } catch (err: any) {
          console.error(err);
          addToast(err.message || "Failed to delete product", "error");
        }
      }
    });
  };

  const handleVariantStockAdjust = async (id: string, colorName: string, change: number) => {
    const key = `${id}-${colorName}`;
    if (busyStockKeys[key]) return;

    setBusyStockKeys(prev => ({ ...prev, [key]: true }));
    try {
      await adminApi.updateVariantStock(id, colorName, change);
      addToast(`Adjusted ${colorName} stock count`, "success");
      onRefreshProducts();
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Failed to adjust stock", "error");
    } finally {
      setBusyStockKeys(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full text-[#0f0e17] dark:text-[#fffffe]">
      {/* Title Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-[#1f2937] dark:text-[#f4f7ff] tracking-tight">Catalog Audit</h2>
          <p className="text-sm text-[#7a1f2d] dark:text-[#ffc2cc] mt-0.5">Manage inventory, pricing, and product details.</p>
        </div>
      </div>

      {/* Interactive Controls & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#717388]" />
          <input 
            type="text" 
            placeholder="Search catalog..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#e2e4ed]/40 dark:border-white/10 bg-[#ffffff] dark:bg-[#212030] focus:border-[#ff8906] focus:ring-1 focus:ring-[#ff8906] outline-none text-sm transition-all text-[#0f0e17] dark:text-white"
          />
        </div>

        {/* Filters Select boxes */}
        <div className="flex flex-wrap gap-2.5">
          {/* Category */}
          <div className="relative">
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-11 px-4 pr-9 rounded-xl border border-[#e2e4ed]/40 dark:border-white/10 bg-[#ffffff] dark:bg-[#212030] text-xs font-semibold text-[#0f0e17] dark:text-white outline-none cursor-pointer hover:bg-[#e6e8eb] dark:hover:bg-[#363636] transition-colors appearance-none"
            >
              <option value="all">All Categories</option>
              <option value="women">Women</option>
              <option value="men">Men</option>
              <option value="kids">Kids</option>
            </select>
            <Filter size={12} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#717388] pointer-events-none" />
          </div>

          {/* Stock Level */}
          <div className="relative">
            <select 
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="h-11 px-4 pr-9 rounded-xl border border-[#e2e4ed]/40 dark:border-white/10 bg-[#ffffff] dark:bg-[#212030] text-xs font-semibold text-[#0f0e17] dark:text-white outline-none cursor-pointer hover:bg-[#e6e8eb] dark:hover:bg-[#363636] transition-colors appearance-none"
            >
              <option value="all">All Stock Levels</option>
              <option value="low">Stock: Low (&lt; 10)</option>
              <option value="ok">Stock: Healthy (&ge; 10)</option>
            </select>
            <Filter size={12} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#717388] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Audit Data Table */}
      <div className="bg-[#ffffff] dark:bg-[#171622] rounded-2xl shadow-sm border border-[#e2e4ed]/40 dark:border-white/10 overflow-hidden flex flex-col transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#f3f4f6] dark:bg-[#212030] border-b border-[#e2e4ed]/40 dark:border-white/10 text-xs font-bold text-[#2f2a2b] dark:text-[#e8f0ff] uppercase tracking-wider">
                <th className="p-4 w-28 text-center">Product View</th>
                <th className="p-4">Title & Specifications</th>
                <th className="p-4 w-32">Category</th>
                <th className="p-4 w-72">Stock Control (Inline)</th>
                <th className="p-4 w-28">New Price</th>
                <th className="p-4 w-28">Old Price</th>
                <th className="p-4 w-44 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e4ed]/20 dark:divide-white/5">
              {filteredProducts.map((prod) => {
                const isEditing = editingProductId === prod.id;
                const isSaving = savingProductId === prod.id;
                const totalStock = prod.stockCount ?? 0;
                
                // Anomalies calculations
                const isLowStock = totalStock < 10;
                const isMissingImages = !prod.image || (prod.images && prod.images.length === 0);

                let rowBgClass = "";
                if (isEditing) {
                  // High contrast bold red/pink background selection layout to prevent light cement gray issues
                  rowBgClass = "bg-[#fff0f2] dark:bg-[#291319] border-y-2 border-[#ff8906]";
                } else if (isMissingImages) {
                  rowBgClass = "bg-amber-500/5 dark:bg-amber-500/10";
                } else if (isLowStock) {
                  rowBgClass = "bg-red-500/5 dark:bg-red-500/10";
                }

                return (
                  <tr 
                    key={prod.id} 
                    className={`transition-all duration-150 hover:bg-[#eff0f6]/30 dark:hover:bg-[#212030]/30 ${rowBgClass}`}
                  >
                    {/* Media Gallery / Single image preview */}
                    <td className="p-4 align-middle">
                      {isEditing && editForm ? (
                        <div className="flex flex-col gap-2 justify-center items-center">
                          {/* Image Thumbnail Grid */}
                          <div className="flex flex-wrap gap-1.5 justify-center max-w-[120px]">
                            {editForm.images.map((img, idx) => (
                              <div 
                                key={idx} 
                                className={`relative w-8 h-10 rounded overflow-hidden border ${
                                  idx === 0 ? "border-[#ff8906] border-2" : "border-[#e2e4ed]/60"
                                } group`}
                              >
                                <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-1">
                                  <button 
                                    type="button" 
                                    onClick={() => handleReplaceClick(idx)} 
                                    className="p-0.5 bg-[#eff0f6] text-[#ff8906] dark:text-[#fffffe] rounded-full hover:bg-[#eff0f6] cursor-pointer"
                                  >
                                    <Pencil size={8} />
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => handleDeleteImage(idx)} 
                                    className="p-0.5 bg-red-600 text-white rounded-full hover:bg-red-700 cursor-pointer"
                                  >
                                    <Trash2 size={8} />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {/* Upload New thumbnail trigger */}
                            <button
                              type="button"
                              onClick={() => { setReplaceIndex(null); document.getElementById(`edit-image-input-file-${prod.id}`)?.click(); }}
                              className="w-8 h-10 border border-dashed border-[#ff8906]/50 dark:border-white/30 rounded flex items-center justify-center text-[#ff8906] dark:text-[#ff8906] hover:border-[#ff8906] cursor-pointer bg-[#ffffff] dark:bg-[#212030]"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <input 
                            type="file" 
                            id={`edit-image-input-file-${prod.id}`}
                            accept="image/*" 
                            multiple={replaceIndex === null}
                            onChange={handleAddImage}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          {isMissingImages ? (
                            <div className="w-12 h-14 rounded-lg border-2 border-dashed border-red-500 flex flex-col items-center justify-center text-red-500 bg-red-500/5">
                              <AlertTriangle size={18} />
                              <span className="text-[7px] font-bold uppercase mt-0.5">No Img</span>
                            </div>
                          ) : (
                            <img 
                              src={prod.image} 
                              alt={prod.name} 
                              className="w-12 h-14 object-cover rounded-lg border border-[#e2e4ed]/40 dark:border-white/10 shadow-sm"
                            />
                          )}
                        </div>
                      )}
                    </td>

                    {/* Specifications */}
                    <td className="p-4 align-middle">
                      {isEditing && editForm ? (
                        <div className="flex flex-col gap-2.5 max-w-sm">
                          <div>
                            <label className="block text-[10px] font-black text-[#2f2a2b] dark:text-[#ffe5ea] uppercase mb-1">Product Title</label>
                            <input 
                              type="text" 
                              value={editForm.name} 
                              placeholder="e.g. Premium Cotton Shirt"
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="w-full px-3 py-1.5 text-xs rounded-lg border-2 border-[#ff8906]/30 focus:border-[#ff8906] outline-none text-[#0f0e17] dark:text-white font-bold bg-[#ffffff] dark:bg-[#212030] placeholder-[#8e6f73] shadow-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-[#2f2a2b] dark:text-[#ffe5ea] uppercase mb-1">🎨 Colors (comma-separated)</label>
                            <input 
                              type="text" 
                              value={editForm.colors.join(', ')} 
                              placeholder="e.g. Black, White, Navy"
                              onChange={(e) => {
                                const newColors = e.target.value.split(',').map(c => c.trim()).filter(Boolean);
                                const newVariants = syncVariants(newColors, editForm.sizes, editForm.variants, editForm.category, editForm.name, editForm.newPrice);
                                setEditForm({ ...editForm, colors: newColors, variants: newVariants });
                              }}
                              className="w-full px-3 py-1.5 text-xs rounded-lg border-2 border-[#ff8906]/30 focus:border-[#ff8906] outline-none text-[#0f0e17] dark:text-white font-bold bg-[#ffffff] dark:bg-[#212030] placeholder-[#8e6f73] shadow-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-[#2f2a2b] dark:text-[#ffe5ea] uppercase mb-1">📏 Sizes (comma-separated)</label>
                            <input 
                              type="text" 
                              value={editForm.sizes.join(', ')} 
                              placeholder="e.g. S, M, L, XL"
                              onChange={(e) => {
                                const newSizes = e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
                                const newVariants = syncVariants(editForm.colors, newSizes, editForm.variants, editForm.category, editForm.name, editForm.newPrice);
                                setEditForm({ ...editForm, sizes: newSizes, variants: newVariants });
                              }}
                              className="w-full px-3 py-1.5 text-xs rounded-lg border-2 border-[#ff8906]/30 focus:border-[#ff8906] outline-none text-[#0f0e17] dark:text-white font-bold bg-[#ffffff] dark:bg-[#212030] placeholder-[#8e6f73] shadow-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-[#2f2a2b] dark:text-[#ffe5ea] uppercase mb-1">📝 Description</label>
                            <textarea 
                              value={editForm.description || ''} 
                              placeholder="e.g. Comfortable fit and light fabric..."
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              rows={2}
                              className="w-full px-3 py-1.5 text-xs rounded-lg border-2 border-[#ff8906]/30 focus:border-[#ff8906] outline-none text-[#0f0e17] dark:text-white font-bold bg-[#ffffff] dark:bg-[#212030] placeholder-[#8e6f73] resize-none shadow-sm"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[#0f0e17] dark:text-[#fffffe] hover:underline cursor-pointer">
                            {prod.name}
                          </span>
                          
                          {/* Warnings overlay tags */}
                          {isMissingImages && (
                            <span className="mt-1 flex items-center gap-1 text-[10px] font-bold text-amber-600">
                              <AlertTriangle size={12} /> Missing Product Images
                            </span>
                          )}

                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-[#717388]">
                            <span className="bg-[#eff0f6] dark:bg-[#212030] px-2 py-0.5 rounded-md">
                              📏 Sizes: <strong className="text-[#2e2f3e] dark:text-[#fffffe]">{prod.sizes?.join(', ') || 'N/A'}</strong>
                            </span>
                            <span className="bg-[#eff0f6] dark:bg-[#212030] px-2 py-0.5 rounded-md">
                              🎨 Colors: <strong className="text-[#2e2f3e] dark:text-[#fffffe]">{prod.colors?.join(', ') || 'N/A'}</strong>
                            </span>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Category Tag */}
                    <td className="p-4 align-middle">
                      {isEditing && editForm ? (
                        <select 
                          value={editForm.category} 
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className="h-9 px-3 rounded-lg border-2 border-[#ff8906]/30 focus:border-[#ff8906] bg-[#ffffff] dark:bg-[#212030] text-xs text-[#0f0e17] dark:text-white font-extrabold outline-none cursor-pointer shadow-sm"
                        >
                          <option value="women">Women</option>
                          <option value="men">Men</option>
                          <option value="kid">Kids</option>
                        </select>
                      ) : (
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          prod.category?.toLowerCase() === 'men' 
                            ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 border border-blue-100 dark:border-blue-950" 
                            : prod.category?.toLowerCase() === 'women'
                              ? "bg-pink-50 dark:bg-pink-950/20 text-[#ff8906] border border-pink-100 dark:border-pink-950" 
                              : "bg-emerald-50 dark:bg-emerald-950/20 text-[#388E3C] border border-emerald-100 dark:border-emerald-950"
                        }`}>
                          {normalizeCategory(prod.category)}
                        </span>
                      )}
                    </td>

                    {/* Stock Control */}
                    <td className="p-4 align-middle">
                      {isEditing && editForm ? (
                        <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                          {editForm.variants.map((v, idx) => (
                            <div key={idx} className="flex items-center gap-2 border-b border-[#e2e4ed]/30 dark:border-white/5 pb-1.5">
                              <span className="w-2.5 h-2.5 rounded-full border border-gray-400" style={{ backgroundColor: v.color.toLowerCase() }}></span>
                              <span className="text-[11px] font-black text-[#2f2a2b] dark:text-[#ffe5ea] min-w-[60px]">{v.color}/{v.size}</span>
                              <input 
                                type="text" 
                                value={v.sku || ""}
                                placeholder="SKU Code"
                                onChange={(e) => handleVariantFieldChange(idx, "sku", e.target.value.toUpperCase())}
                                className="flex-1 px-2.5 py-1 text-[11px] font-bold font-mono rounded border-2 border-[#ff8906]/20 bg-[#ffffff] dark:bg-[#212030] text-[#0f0e17] dark:text-white placeholder-[#8e6f73]"
                              />
                              <input 
                                type="number" 
                                value={v.stock}
                                onChange={(e) => handleVariantFieldChange(idx, "stock", Math.max(0, Number(e.target.value)))}
                                min="0"
                                className="w-16 px-2 py-1 text-[11px] font-bold rounded border-2 border-[#ff8906]/20 bg-[#ffffff] dark:bg-[#212030] text-[#0f0e17] dark:text-white"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {/* Inventory Warning Badge */}
                          {isLowStock ? (
                            <div className="flex items-center gap-1.5 mb-1 text-red-600 font-extrabold text-xs">
                              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                              <span>{totalStock} in stock (Low Stock Alert)</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 mb-1 text-[#388E3C] font-extrabold text-xs">
                              <span className="w-2 h-2 rounded-full bg-[#1f7a3d]"></span>
                              <span className="text-[#166534] dark:text-[#9be7b2]">{totalStock} in stock (Healthy)</span>
                            </div>
                          )}

                          {/* Quick Adjust buttons per Variant */}
                          <div className="flex flex-col gap-1">
                            {(prod.variants || []).slice(0, 3).map((v, vidx) => {
                              const stockKey = `${prod.id}-${v.color}`;
                              const isBusy = busyStockKeys[stockKey];

                              return (
                                <div key={vidx} className="flex items-center justify-between text-[11px] text-[#2e2f3e] dark:text-[#a7a9be] max-w-[200px]">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full border border-gray-400" style={{ backgroundColor: v.color.toLowerCase() }}></span>
                                    <span>{v.color}/{v.size}:</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button 
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => handleVariantStockAdjust(prod.id, v.color, -5)}
                                      className="w-5 h-5 flex items-center justify-center bg-[#eff0f6] dark:bg-[#212030] border border-[#e2e4ed]/40 dark:border-white/10 hover:bg-[#e6e8eb] rounded text-xs font-bold disabled:opacity-50 cursor-pointer text-[#0f0e17] dark:text-white"
                                    >
                                      -
                                    </button>
                                    <span className="w-7 text-center font-bold">{v.stock}</span>
                                    <button 
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => handleVariantStockAdjust(prod.id, v.color, 5)}
                                      className="w-5 h-5 flex items-center justify-center bg-[#eff0f6] dark:bg-[#212030] border border-[#e2e4ed]/40 dark:border-white/10 hover:bg-[#e6e8eb] rounded text-xs font-bold disabled:opacity-50 cursor-pointer text-[#0f0e17] dark:text-white"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                            {prod.variants && prod.variants.length > 3 && (
                              <span className="text-[10px] text-[#717388] mt-0.5">+ {prod.variants.length - 3} more variants</span>
                            )}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* New Price */}
                    <td className="p-4 align-middle font-bold text-[#0f0e17] dark:text-[#fffffe]">
                      {isEditing && editForm ? (
                        <input 
                          type="number" 
                          value={editForm.newPrice} 
                          onChange={(e) => setEditForm({ ...editForm, newPrice: Number(e.target.value) })}
                          className="w-20 px-2 py-1 text-xs rounded border-2 border-[#ff8906]/20 bg-[#ffffff] dark:bg-[#212030] text-[#0f0e17] dark:text-white font-extrabold outline-none shadow-sm"
                        />
                      ) : (
                        <span>₹{prod.newPrice}</span>
                      )}
                    </td>

                    {/* Old Price */}
                    <td className="p-4 align-middle text-[#717388] line-through">
                      {isEditing && editForm ? (
                        <input 
                          type="number" 
                          value={editForm.oldPrice} 
                          onChange={(e) => setEditForm({ ...editForm, oldPrice: Number(e.target.value) })}
                          className="w-20 px-2 py-1 text-xs rounded border-2 border-[#ff8906]/20 bg-[#ffffff] dark:bg-[#212030] text-[#0f0e17] dark:text-white font-bold outline-none shadow-sm"
                        />
                      ) : (
                        <span>₹{prod.oldPrice || 0}</span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="p-4 align-middle text-right">
                      <div className="flex gap-1.5 justify-end">
                        {isEditing ? (
                          <>
                            <button 
                              type="button" 
                              disabled={isSaving}
                              onClick={() => handleSaveEdit(prod.id)}
                              className="px-3.5 py-1.5 bg-[#388E3C] hover:bg-[#2E7D32] text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer border-none"
                            >
                              {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                              Save
                            </button>
                            <button 
                              type="button" 
                              disabled={isSaving}
                              onClick={() => setEditingProductId(null)}
                              className="px-3.5 py-1.5 bg-[#ffffff] dark:bg-[#212030] border border-[#e2e4ed]/60 hover:bg-[#eff0f6] dark:hover:bg-[#363636] text-[#2e2f3e] dark:text-[#a7a9be] text-xs font-black rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <X size={12} />
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              type="button" 
                              onClick={() => startEditing(prod)}
                              className="px-3 py-1.5 bg-[#ffffff] dark:bg-[#212030] border border-[#e2e4ed]/60 hover:bg-[#eff0f6] dark:hover:bg-[#363636] text-[#2e2f3e] dark:text-[#a7a9be] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Pencil size={12} />
                              Edit
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleDeleteProduct(prod)}
                              className="px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border-none"
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-sm font-medium text-[#717388]">
                    No products found matching the search/filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCatalogTab;
