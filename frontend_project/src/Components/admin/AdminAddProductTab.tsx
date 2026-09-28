import React, { useState, useMemo, DragEvent, ChangeEvent } from 'react';
import { FolderPlus, Upload, ShieldAlert, Loader2, Trash2, Plus, FileText, DollarSign, Tag, Image as ImageIcon } from 'lucide-react';
import { adminApi } from '../../Utils/adminApi';
import { compressImageToBase64 } from '../../Utils/adminHelpers';
import { ProductVariant } from '../../features/catalog/types/productTypes';

const PRESET_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '4XL', 'Free Size'];
const PRESET_COLORS = ['Black', 'White', 'Navy Blue', 'Beige', 'Charcoal', 'Red', 'Blue', 'Green', 'Pink', 'Sandal', 'Maroon', 'Olive'];

interface AdminAddProductTabProps {
  onProductAdded: () => void;
  addToast: (message: string, type: "success" | "error" | "info" | "warning") => void;
  logAction: (message: string) => void;
}

export const AdminAddProductTab: React.FC<AdminAddProductTabProps> = ({
  onProductAdded,
  addToast,
  logAction
}) => {
  // Form Details
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("women");
  
  // Chip selections
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['S', 'M', 'L', 'XL', 'XXL']);
  const [selectedColors, setSelectedColors] = useState<string[]>(['Black', 'White']);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [customColorInput, setCustomColorInput] = useState("");
  const [customHexColor, setCustomHexColor] = useState("#b80035");

  // Drag & drop multiple images (base64 string array)
  const [images, setImages] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);

  // States
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});

  // Size-specific Pricing & Stock state
  const [sizeDetails, setSizeDetails] = useState<Record<string, { price?: number; oldPrice?: number; old_price?: number; stock: number; inStock: boolean }>>({
    'XXS': { price: 178, oldPrice: 299, stock: 0, inStock: false },
    'S': { price: 238, oldPrice: 399, stock: 25, inStock: true },
    'M': { price: 243, oldPrice: 429, stock: 40, inStock: true },
    'L': { price: 253, oldPrice: 449, stock: 30, inStock: true },
    'XL': { price: 258, oldPrice: 469, stock: 20, inStock: true },
    'XXL': { price: 262, oldPrice: 499, stock: 15, inStock: true },
    'XXXL': { price: 342, oldPrice: 599, stock: 10, inStock: true },
    '4XL': { price: 342, oldPrice: 599, stock: 8, inStock: true },
  });

  // Size/Color chip toggle handlers
  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
    setFieldErrors(prev => ({ ...prev, sizes: null }));
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
    setFieldErrors(prev => ({ ...prev, colors: null }));
  };

  const handleAddCustomSize = () => {
    const trimmed = customSizeInput.trim().toUpperCase();
    if (!trimmed) return;
    if (!selectedSizes.includes(trimmed)) {
      setSelectedSizes(prev => [...prev, trimmed]);
      addToast(`Added custom size "${trimmed}"`, "success");
    }
    setCustomSizeInput("");
  };

  const handleAddCustomColor = () => {
    const trimmed = customColorInput.trim();
    if (!trimmed) return;
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    if (!selectedColors.includes(formatted)) {
      setSelectedColors(prev => [...prev, formatted]);
      addToast(`Added custom color "${formatted}"`, "success");
    }
    setCustomColorInput("");
  };

  // Drag handlers
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Helper to process files
  const processFiles = async (files: FileList) => {
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
        setImages(prev => {
          const updated = [...prev];
          updated[replaceIndex] = loadedImages[0];
          return updated;
        });
        setReplaceIndex(null);
        addToast("Image replaced successfully!", "success");
      } else {
        setImages(prev => [...prev, ...loadedImages]);
      }
      setFieldErrors(prev => ({ ...prev, images: null }));
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files);
    }
  };

  const handleDeleteImage = (index: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== index));
    addToast("Image removed from uploader", "info");
  };

  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    setImages(prev => {
      const updated = [...prev];
      const item = updated.splice(fromIndex, 1)[0];
      updated.splice(toIndex, 0, item);
      return updated;
    });
  };

  const IMAGE_ROLES = ["1. Front", "2. Back", "3. Side", "4. Detail", "5. Additional"];

  const handleSizePriceChange = (size: string, val: number) => {
    setSizeDetails(prev => ({
      ...prev,
      [size]: {
        ...(prev[size] || { stock: 15, inStock: true }),
        price: val
      }
    }));
  };

  const handleSizeOldPriceChange = (size: string, val: number) => {
    setSizeDetails(prev => ({
      ...prev,
      [size]: {
        ...(prev[size] || { stock: 15, inStock: true }),
        oldPrice: val,
        old_price: val
      }
    }));
  };

  const handleToggleSizeStock = (size: string) => {
    setSizeDetails(prev => {
      const current = prev[size] || { price: 0, stock: 15, inStock: true };
      const nextInStock = !current.inStock;
      return {
        ...prev,
        [size]: {
          ...current,
          inStock: nextInStock,
          stock: nextInStock ? (current.stock || 15) : 0
        }
      };
    });
  };

  const handleSizeUnitsChange = (size: string, units: number) => {
    setSizeDetails(prev => ({
      ...prev,
      [size]: {
        ...(prev[size] || { price: 0, inStock: true }),
        stock: units,
        inStock: units > 0
      }
    }));
  };

  // Generate size-tier variants
  const generatedVariants = useMemo(() => {
    const list: ProductVariant[] = [];
    const baseSlugName = name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '-')
      .substring(0, 15) || "ITEM";

    const primaryColor = selectedColors[0] || "Standard";

    selectedSizes.forEach(size => {
      const detail = sizeDetails[size];
      const sizePrice = detail?.price !== undefined ? detail.price : 0;
      const sizeOldPrice = detail?.oldPrice !== undefined 
        ? detail.oldPrice 
        : (detail?.old_price !== undefined ? detail.old_price : (sizePrice ? Math.round(sizePrice * 1.5) : 0));
      const sizeStock = detail?.inStock !== false ? (detail?.stock ?? 15) : 0;

      list.push({
        sku: `RC-${category.substring(0, 3).toUpperCase()}-${baseSlugName}-${size}`,
        color: primaryColor,
        size,
        stock: sizeStock,
        price: sizePrice,
        oldPrice: sizeOldPrice,
        old_price: sizeOldPrice
      });
    });
    return list;
  }, [selectedSizes, selectedColors, name, category, sizeDetails]);

  const totalCalculatedStock = useMemo(() => {
    return generatedVariants.reduce((sum, v) => sum + v.stock, 0);
  }, [generatedVariants]);

  // Validation
  const validateForm = () => {
    const errors: Record<string, string | null> = {};
    if (!name.trim()) errors.name = "Product title is required";
    if (!description.trim()) errors.description = "Product description is required";
    if (selectedSizes.length === 0) errors.sizes = "Select at least one size";
    if (selectedColors.length === 0) errors.colors = "Select at least one color";
    if (images.length === 0) errors.images = "Upload at least one product image";

    // Validate size prices in size table
    const invalidPriceSize = selectedSizes.find(sz => {
      const p = sizeDetails[sz]?.price;
      return p === undefined || p <= 0;
    });
    if (invalidPriceSize) {
      errors.sizes = `Please enter a valid New Price (₹ > 0) for size "${invalidPriceSize}" in the size table below`;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (!validateForm()) {
      addToast("Please correct the form fields with errors", "error");
      return;
    }

    setSaving(true);
    const primaryImage = images[0];
    const validVariantPrices = generatedVariants.map(v => Number(v.price)).filter(p => !isNaN(p) && p > 0);
    const validVariantOldPrices = generatedVariants.map(v => Number(v.oldPrice || v.old_price)).filter(p => !isNaN(p) && p > 0);
    const finalNewPrice = validVariantPrices.length > 0 ? Math.min(...validVariantPrices) : 0;
    const finalOldPrice = validVariantOldPrices.length > 0 ? Math.max(...validVariantOldPrices) : (finalNewPrice ? Math.round(finalNewPrice * 1.5) : 0);

    const payload = {
      name,
      description,
      category,
      newPrice: finalNewPrice,
      oldPrice: finalOldPrice,
      sizes: selectedSizes,
      colors: selectedColors,
      variants: generatedVariants,
      stockCount: totalCalculatedStock,
      image: primaryImage,
      images: images,
      available: true
    };

    try {
      await adminApi.addProduct(payload);
      addToast(`🎉 Added product "${name}" successfully!`, "success");
      logAction(`Launched new product: "${name}"`);
      onProductAdded();
    } catch (err: any) {
      console.error("Error creating product:", err);
      addToast(err.message || "Failed to create product listing.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full text-[#0f0e17] dark:text-[#fffffe]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Add New Product</h2>
          <p className="text-sm text-[#717388] mt-0.5">Create a new listing in the catalog</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Form Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Columns (Main Info) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* General Info Card */}
            <div className="bg-[#ffffff] dark:bg-[#171622] rounded-2xl shadow-sm border border-[#e2e4ed]/40 dark:border-white/10 p-6 flex flex-col gap-4">
              <h3 className="text-sm font-black text-[#e53170] dark:text-[#ff8906] uppercase tracking-wider flex items-center gap-2 border-b border-[#e2e4ed]/20 dark:border-white/5 pb-3">
                <FileText size={18} /> Basic Information
              </h3>
              
              {/* Title */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be]">Product Title <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  placeholder="e.g. Premium Cotton Blend Slim Fit Shirt" 
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setFieldErrors(prev => ({ ...prev, name: null }));
                  }}
                  className={`w-full h-11 px-4 rounded-xl border bg-[#ffffff] dark:bg-[#212030] outline-none text-sm transition-all focus:border-[#ff8906] focus:ring-1 focus:ring-[#ff8906] ${
                    fieldErrors.name ? 'border-red-500' : 'border-[#e2e4ed]/40 dark:border-white/10'
                  }`}
                />
                {fieldErrors.name && (
                  <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-1">
                    <ShieldAlert size={12}/>{fieldErrors.name}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be]">Detailed Description <span className="text-red-500">*</span></label>
                <textarea 
                  rows={4} 
                  placeholder="Enter details, materials guidelines, or care instructions..." 
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setFieldErrors(prev => ({ ...prev, description: null }));
                  }}
                  className={`w-full p-4 rounded-xl border bg-[#ffffff] dark:bg-[#212030] outline-none text-sm resize-none transition-all focus:border-[#ff8906] focus:ring-1 focus:ring-[#ff8906] ${
                    fieldErrors.description ? 'border-red-500' : 'border-[#e2e4ed]/40 dark:border-white/10'
                  }`}
                />
                {fieldErrors.description && (
                  <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-1">
                    <ShieldAlert size={12}/>{fieldErrors.description}
                  </span>
                )}
              </div>
            </div>

            {/* Sizing & Color Specs */}
            <div className="bg-[#ffffff] dark:bg-[#171622] rounded-2xl shadow-sm border border-[#e2e4ed]/40 dark:border-white/10 p-6 flex flex-col gap-4">
              <div className="border-b border-[#e2e4ed]/20 dark:border-white/5 pb-3">
                <h3 className="text-sm font-black text-[#e53170] dark:text-[#ff8906] uppercase tracking-wider flex items-center gap-2">
                  <DollarSign size={18} /> Sizing &amp; Color Specs
                </h3>
                <p className="text-[11px] text-[#717388] mt-1">
                  Select available sizes &amp; colors below. Set custom New Price (₹), Old Price (₹), and units per size in the table at the bottom.
                </p>
              </div>

              {/* Sizes available */}
              <div className="flex flex-col gap-2.5 mt-2">
                <label className="text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be]">Select Available Sizes</label>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set([...PRESET_SIZES, ...selectedSizes])).map((size) => {
                    const isSelected = selectedSizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                          isSelected 
                            ? "bg-[#ff8906] border-[#ff8906] text-white" 
                            : "bg-[#eff0f6] dark:bg-[#212030] border-[#e2e4ed]/40 text-[#2e2f3e] dark:text-[#a7a9be]"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                {/* Custom size adder */}
                <div className="flex gap-2 max-w-sm mt-1">
                  <input
                    type="text"
                    placeholder="Custom size (e.g. FS, 38, 40)"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSize(); } }}
                    className="flex-1 h-9 px-3 rounded-lg border border-[#e2e4ed]/40 dark:border-white/10 bg-[#ffffff] dark:bg-[#212030] text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSize}
                    className="h-9 px-3 bg-[#ff8906] hover:bg-[#e53170] text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer border-none shadow-sm"
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
                {fieldErrors.sizes && <span className="text-[10px] text-red-500 font-bold mt-1">{fieldErrors.sizes}</span>}
              </div>

              {/* Colors selection */}
              <div className="flex flex-col gap-2.5 mt-2">
                <label className="text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be]">Select Available Colors</label>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set([...PRESET_COLORS, ...selectedColors])).map((color) => {
                    const isSelected = selectedColors.includes(color);
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => toggleColor(color)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                          isSelected 
                            ? "bg-[#ff8906] border-[#ff8906] text-white" 
                            : "bg-[#eff0f6] dark:bg-[#212030] border-[#e2e4ed]/40 text-[#2e2f3e] dark:text-[#a7a9be]"
                        }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
                {/* Custom Color adder */}
                <div className="flex gap-2 max-w-sm mt-1">
                  <input
                    type="color"
                    value={customHexColor}
                    onChange={(e) => setCustomHexColor(e.target.value)}
                    className="w-9 h-9 border border-[#e2e4ed]/40 rounded-lg cursor-pointer p-0 bg-transparent shrink-0"
                    title="Choose Palette"
                  />
                  <input
                    type="text"
                    placeholder="Custom color (e.g. Mustard, Sandal)"
                    value={customColorInput}
                    onChange={(e) => setCustomColorInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomColor(); } }}
                    className="flex-1 h-9 px-3 rounded-lg border border-[#e2e4ed]/40 dark:border-white/10 bg-[#ffffff] dark:bg-[#212030] text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomColor}
                    className="h-9 px-3 bg-[#ff8906] hover:bg-[#e53170] text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer border-none shadow-sm"
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
                {fieldErrors.colors && <span className="text-[10px] text-red-500 font-bold mt-1">{fieldErrors.colors}</span>}
              </div>
            </div>
          </div>

          {/* Right Column (Media Upload & Info) */}
          <div className="flex flex-col gap-6">
            {/* Image Upload card */}
            <div className="bg-[#ffffff] dark:bg-[#171622] rounded-2xl shadow-sm border border-[#e2e4ed]/40 dark:border-white/10 p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-[#e2e4ed]/20 dark:border-white/5 pb-3">
                <h3 className="text-sm font-black text-[#e53170] dark:text-[#ff8906] uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon size={18} /> Media Files (Up to 5 Views)
                </h3>
                <span className="text-[11px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                  {images.length}/5 Added
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-200">
                <p className="font-semibold">Recommended 5 views: 1. Front (Cover), 2. Back, 3. Side, 4. Detail, 5. Size Chart.</p>
                <p className="text-[10px] opacity-80 mt-0.5">Use the &larr; and &rarr; arrow buttons below to reorder images easily.</p>
              </div>
              
              {/* Drag zone */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('add-multiple-file-input')?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-2.5 ${
                  dragActive 
                    ? "border-[#ff8906] bg-[#ff8906]/5" 
                    : fieldErrors.images 
                      ? "border-red-500 bg-red-500/5" 
                      : "border-[#e2e4ed]/60 dark:border-white/10 bg-[#eff0f6]/30 dark:bg-[#212030]/30 hover:bg-[#e6e8eb] dark:hover:bg-[#363636]"
                }`}
              >
                <Upload size={28} className="text-[#ff8906] animate-bounce" />
                <div>
                  <p className="text-xs font-bold text-[#0f0e17] dark:text-white">Drag &amp; drop product images</p>
                  <p className="text-[10px] text-[#717388] mt-0.5">or click to browse from device (PNG, JPG, WebP)</p>
                </div>
                <input 
                  id="add-multiple-file-input" 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleFileInput} 
                  className="hidden" 
                />
              </div>
              {fieldErrors.images && <span className="text-[10px] text-red-500 font-bold mt-0.5">{fieldErrors.images}</span>}

              {/* Upload Previews with Ordering & Roles */}
              {images.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500">
                    <span>Ordered Views ({images.length}/5)</span>
                    <span className="text-[10px] text-zinc-400">Re-order using &larr; / &rarr;</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {images.map((img, idx) => {
                      const roleLabel = IMAGE_ROLES[idx] || `${idx + 1}. Additional`;
                      return (
                        <div 
                          key={idx} 
                          className={`relative aspect-[3/4] rounded-xl overflow-hidden border bg-zinc-100 dark:bg-zinc-800 ${
                            idx === 0 ? "border-2 border-black dark:border-white shadow-sm" : "border-zinc-200 dark:border-zinc-700"
                          } group flex flex-col justify-between`}
                        >
                          <img src={img} alt={roleLabel} className="absolute inset-0 w-full h-full object-cover" />
                          
                          {/* Role Badge */}
                          <div className="relative z-10 p-1.5 flex justify-between items-start">
                            <span className="bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                              {roleLabel}
                            </span>
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDeleteImage(idx); }}
                              className="bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700 cursor-pointer border-none opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete view"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>

                          {/* Re-order controls at bottom */}
                          <div className="relative z-10 p-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between mt-auto">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={(e) => { e.stopPropagation(); handleMoveImage(idx, idx - 1); }}
                              className="p-1 rounded bg-white/20 hover:bg-white/40 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[10px] cursor-pointer border-none"
                              title="Move view earlier"
                            >
                              &larr;
                            </button>
                            <span className="text-[9px] text-white/90 font-mono font-bold">
                              #{idx + 1}
                            </span>
                            <button
                              type="button"
                              disabled={idx === images.length - 1}
                              onClick={(e) => { e.stopPropagation(); handleMoveImage(idx, idx + 1); }}
                              className="p-1 rounded bg-white/20 hover:bg-white/40 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[10px] cursor-pointer border-none"
                              title="Move view later"
                            >
                              &rarr;
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Organization & Category selection card */}
            <div className="bg-[#ffffff] dark:bg-[#171622] rounded-2xl shadow-sm border border-[#e2e4ed]/40 dark:border-white/10 p-6 flex flex-col gap-4">
              <h3 className="text-sm font-black text-[#e53170] dark:text-[#ff8906] uppercase tracking-wider flex items-center gap-2 border-b border-[#e2e4ed]/20 dark:border-white/5 pb-3">
                <Tag size={18} /> Organization
              </h3>

              <div className="flex flex-col gap-3">
                {/* Category select */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be]">Catalog Category</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-[#e2e4ed]/40 dark:border-white/10 bg-[#ffffff] dark:bg-[#212030] text-xs font-semibold outline-none cursor-pointer"
                  >
                    <option value="women">Women's Apparel</option>
                    <option value="men">Men's Collection</option>
                    <option value="kid">Kids / Children Wear</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Size-Specific Pricing & Stock Control Table */}
        {selectedSizes.length > 0 && (
          <div className="bg-[#ffffff] dark:bg-[#171622] rounded-2xl shadow-sm border border-[#e2e4ed]/40 dark:border-white/10 p-6 flex flex-col gap-4 mt-2">
            <div className="flex justify-between items-center flex-wrap gap-4 border-b border-[#e2e4ed]/20 dark:border-white/5 pb-3">
              <div>
                <h3 className="text-sm font-black text-[#0f0e17] dark:text-white uppercase tracking-wider">Size-Specific Pricing &amp; Stock Control</h3>
                <p className="text-[11px] text-[#717388] font-medium mt-1">Set customized prices and stock availability per size. Out-of-stock sizes will be struck out on the storefront.</p>
              </div>
              <span className="text-xs font-extrabold text-[#ff8906] bg-[#eff0f6]/50 dark:bg-white/5 px-3 py-1 rounded-full border border-[#ff8906]/20">
                Total Available Units: {totalCalculatedStock}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-[#e2e4ed]/30 dark:border-white/10 text-xs font-bold text-[#717388]">
                    <th className="p-3">Size Tier</th>
                    <th className="p-3 w-36">New Price (₹)</th>
                    <th className="p-3 w-36">Old Price (₹)</th>
                    <th className="p-3 w-36">Stock Status</th>
                    <th className="p-3 w-32">Units in Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e4ed]/20 dark:divide-white/5">
                  {selectedSizes.map((sz) => {
                    const detail = sizeDetails[sz] || { price: 0, stock: 15, inStock: true };
                    const currentPrice = detail.price !== undefined ? detail.price : 0;
                    const currentOldPrice = detail.oldPrice !== undefined 
                      ? detail.oldPrice 
                      : (detail.old_price !== undefined ? detail.old_price : (currentPrice ? Math.round(currentPrice * 1.5) : 0));
                    const isInStock = detail.inStock !== false;

                    return (
                      <tr key={sz} className={`text-xs ${!isInStock ? 'opacity-60 bg-red-500/5' : ''}`}>
                        <td className="p-3">
                          <span className={`inline-block px-3 py-1 font-bold rounded-lg ${isInStock ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 line-through'}`}>
                            {sz}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="relative flex items-center">
                            <span className="absolute left-2.5 text-xs text-zinc-400 font-bold">₹</span>
                            <input 
                              type="number"
                              min="0"
                              placeholder="0"
                              value={currentPrice || ""}
                              onChange={(e) => handleSizePriceChange(sz, e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
                              className="w-28 h-9 pl-6 pr-2 text-xs font-bold rounded-lg border border-[#e2e4ed]/40 dark:border-white/10 bg-[#ffffff] dark:bg-[#212030] outline-none text-[#ff8906] focus:border-[#ff8906]"
                            />
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="relative flex items-center">
                            <span className="absolute left-2.5 text-xs text-zinc-400 font-bold">₹</span>
                            <input 
                              type="number"
                              min="0"
                              placeholder="0"
                              value={currentOldPrice || ""}
                              onChange={(e) => handleSizeOldPriceChange(sz, e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
                              className="w-28 h-9 pl-6 pr-2 text-xs font-semibold rounded-lg border border-[#e2e4ed]/40 dark:border-white/10 bg-[#ffffff] dark:bg-[#212030] outline-none text-zinc-500 focus:border-[#ff8906]"
                            />
                          </div>
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => handleToggleSizeStock(sz)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                              isInStock 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' 
                                : 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800'
                            }`}
                          >
                            {isInStock ? "● In Stock" : "✕ Out of Stock"}
                          </button>
                        </td>
                        <td className="p-3">
                          <input 
                            type="number"
                            min="0"
                            disabled={!isInStock}
                            value={isInStock ? detail.stock : 0}
                            onChange={(e) => handleSizeUnitsChange(sz, Math.max(0, Number(e.target.value)))}
                            className="w-24 h-9 px-2 text-xs font-semibold rounded-lg border border-[#e2e4ed]/40 dark:border-white/10 bg-[#ffffff] dark:bg-[#212030] outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto self-start mt-2 px-6 py-3 bg-[#ff8906] hover:bg-[#e53170] text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#ff8906]/20 disabled:opacity-50 border-none transition-all duration-200"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <FolderPlus size={18} />}
          <span>{saving ? "Publishing Catalog Listing..." : "Publish Product Listing"}</span>
        </button>
      </form>
    </div>
  );
};
export default AdminAddProductTab;
