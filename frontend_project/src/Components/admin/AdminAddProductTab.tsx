import React, { useState, useMemo, DragEvent, ChangeEvent } from 'react';
import { FolderPlus, Upload, ShieldAlert, Loader2, Trash2, Plus, FileText, DollarSign, Tag, Image as ImageIcon } from 'lucide-react';
import { adminApi } from '../../Utils/adminApi';
import { compressImageToBase64 } from '../../Utils/adminHelpers';
import { ProductVariant } from '../../features/catalog/types/productTypes';

const PRESET_SIZES = ['Free Size', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36'];
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
  const [newPrice, setNewPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  
  // Chip selections
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
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

  // Manual overrides for variants (price & stock per size/color)
  const [manualVariants, setManualVariants] = useState<Partial<ProductVariant>[]>([]);

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

  // Variant Builder
  const generatedVariants = useMemo(() => {
    const list: ProductVariant[] = [];
    const baseSlugName = name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '-')
      .substring(0, 15) || "ITEM";

    selectedColors.forEach(color => {
      selectedSizes.forEach(size => {
        const skuPattern = `RC-${category.substring(0, 3).toUpperCase()}-${baseSlugName}-${color.toUpperCase()}-${size}`;
        const override = manualVariants.find(v => v.color === color && v.size === size);

        list.push({
          sku: override?.sku || skuPattern,
          color,
          size,
          stock: override?.stock !== undefined ? override.stock : 10,
          price: override?.price !== undefined ? override.price : Number(newPrice) || 0
        });
      });
    });
    return list;
  }, [selectedColors, selectedSizes, name, category, newPrice, manualVariants]);

  const totalCalculatedStock = useMemo(() => {
    return generatedVariants.reduce((sum, v) => sum + v.stock, 0);
  }, [generatedVariants]);

  const updateVariantField = (color: string, size: string, field: keyof ProductVariant, value: any) => {
    setManualVariants(prev => {
      const idx = prev.findIndex(v => v.color === color && v.size === size);
      const updated = [...prev];
      if (idx !== -1) {
        updated[idx] = { ...updated[idx], [field]: value };
      } else {
        const currentGenerated = generatedVariants.find(v => v.color === color && v.size === size);
        updated.push({
          color,
          size,
          sku: currentGenerated?.sku || "",
          stock: currentGenerated?.stock || 10,
          price: currentGenerated?.price || Number(newPrice) || 0,
          [field]: value
        });
      }
      return updated;
    });
  };

  // Validation
  const validateForm = () => {
    const errors: Record<string, string | null> = {};
    if (!name.trim()) errors.name = "Product title is required";
    if (!description.trim()) errors.description = "Product description is required";
    if (!newPrice || Number(newPrice) <= 0) errors.newPrice = "Promo price must be positive";
    if (!oldPrice || Number(oldPrice) <= 0) errors.oldPrice = "MSRP price must be positive";
    if (Number(newPrice) > Number(oldPrice)) errors.newPrice = "Promo price should not exceed MSRP";
    if (selectedSizes.length === 0) errors.sizes = "Select at least one size";
    if (selectedColors.length === 0) errors.colors = "Select at least one color";
    if (images.length === 0) errors.images = "Upload at least one product image";

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
    const payload = {
      name,
      description,
      category,
      newPrice: Number(newPrice),
      oldPrice: Number(oldPrice),
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
    <div className="flex flex-col gap-6 animate-fade-in w-full text-[#1E1B4B] dark:text-[#F5F3FF]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Add New Product</h2>
          <p className="text-sm text-[#9CA3AF] mt-0.5">Create a new listing in the catalog</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Form Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Columns (Main Info) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* General Info Card */}
            <div className="bg-white dark:bg-[#141428] rounded-2xl shadow-sm border border-[#DDD6FE]/40 dark:border-white/10 p-6 flex flex-col gap-4">
              <h3 className="text-sm font-black text-[#6D28D9] dark:text-[#A78BFA] uppercase tracking-wider flex items-center gap-2 border-b border-[#DDD6FE]/20 dark:border-white/5 pb-3">
                <FileText size={18} /> Basic Information
              </h3>
              
              {/* Title */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#4B5563] dark:text-[#C4B5FD]">Product Title <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  placeholder="e.g. Premium Cotton Blend Slim Fit Shirt" 
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setFieldErrors(prev => ({ ...prev, name: null }));
                  }}
                  className={`w-full h-11 px-4 rounded-xl border bg-white dark:bg-[#1A1A35] outline-none text-sm transition-all focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] ${
                    fieldErrors.name ? 'border-red-500' : 'border-[#DDD6FE]/40 dark:border-white/10'
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
                <label className="text-xs font-bold text-[#4B5563] dark:text-[#C4B5FD]">Detailed Description <span className="text-red-500">*</span></label>
                <textarea 
                  rows={4} 
                  placeholder="Enter details, materials guidelines, or care instructions..." 
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setFieldErrors(prev => ({ ...prev, description: null }));
                  }}
                  className={`w-full p-4 rounded-xl border bg-white dark:bg-[#1A1A35] outline-none text-sm resize-none transition-all focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] ${
                    fieldErrors.description ? 'border-red-500' : 'border-[#DDD6FE]/40 dark:border-white/10'
                  }`}
                />
                {fieldErrors.description && (
                  <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-1">
                    <ShieldAlert size={12}/>{fieldErrors.description}
                  </span>
                )}
              </div>
            </div>

            {/* Pricing & Inventory Configuration */}
            <div className="bg-white dark:bg-[#141428] rounded-2xl shadow-sm border border-[#DDD6FE]/40 dark:border-white/10 p-6 flex flex-col gap-4">
              <h3 className="text-sm font-black text-[#6D28D9] dark:text-[#A78BFA] uppercase tracking-wider flex items-center gap-2 border-b border-[#DDD6FE]/20 dark:border-white/5 pb-3">
                <DollarSign size={18} /> Pricing &amp; Sizing Specs
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Base price */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#4B5563] dark:text-[#C4B5FD]">Discounted Price (₹) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    placeholder="e.g. 799" 
                    value={newPrice}
                    onChange={(e) => {
                      setNewPrice(e.target.value);
                      setFieldErrors(prev => ({ ...prev, newPrice: null }));
                    }}
                    className={`w-full h-11 px-4 rounded-xl border bg-white dark:bg-[#1A1A35] outline-none text-sm focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] ${
                      fieldErrors.newPrice ? 'border-red-500' : 'border-[#DDD6FE]/40 dark:border-white/10'
                    }`}
                  />
                  {fieldErrors.newPrice && (
                    <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-1">
                      <ShieldAlert size={12}/>{fieldErrors.newPrice}
                    </span>
                  )}
                </div>

                {/* MSRP */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#4B5563] dark:text-[#C4B5FD]">Maximum Retail Price / MSRP (₹) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    placeholder="e.g. 1499" 
                    value={oldPrice}
                    onChange={(e) => {
                      setOldPrice(e.target.value);
                      setFieldErrors(prev => ({ ...prev, oldPrice: null }));
                    }}
                    className={`w-full h-11 px-4 rounded-xl border bg-white dark:bg-[#1A1A35] outline-none text-sm focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] ${
                      fieldErrors.oldPrice ? 'border-red-500' : 'border-[#DDD6FE]/40 dark:border-white/10'
                    }`}
                  />
                  {fieldErrors.oldPrice && (
                    <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-1">
                      <ShieldAlert size={12}/>{fieldErrors.oldPrice}
                    </span>
                  )}
                </div>
              </div>

              {/* Sizes available */}
              <div className="flex flex-col gap-2.5 mt-2">
                <label className="text-xs font-bold text-[#4B5563] dark:text-[#C4B5FD]">Select Available Sizes</label>
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
                            ? "bg-[#7C3AED] border-[#7C3AED] text-white" 
                            : "bg-[#EEF0F8] dark:bg-[#1A1A35] border-[#DDD6FE]/40 text-[#4B5563] dark:text-[#C4B5FD]"
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
                    className="flex-1 h-9 px-3 rounded-lg border border-[#DDD6FE]/40 dark:border-white/10 bg-white dark:bg-[#1A1A35] text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSize}
                    className="h-9 px-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer border-none shadow-sm"
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
                {fieldErrors.sizes && <span className="text-[10px] text-red-500 font-bold mt-1">{fieldErrors.sizes}</span>}
              </div>

              {/* Colors selection */}
              <div className="flex flex-col gap-2.5 mt-2">
                <label className="text-xs font-bold text-[#4B5563] dark:text-[#C4B5FD]">Select Available Colors</label>
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
                            ? "bg-[#7C3AED] border-[#7C3AED] text-white" 
                            : "bg-[#EEF0F8] dark:bg-[#1A1A35] border-[#DDD6FE]/40 text-[#4B5563] dark:text-[#C4B5FD]"
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
                    className="w-9 h-9 border border-[#DDD6FE]/40 rounded-lg cursor-pointer p-0 bg-transparent shrink-0"
                    title="Choose Palette"
                  />
                  <input
                    type="text"
                    placeholder="Custom color (e.g. Mustard, Sandal)"
                    value={customColorInput}
                    onChange={(e) => setCustomColorInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomColor(); } }}
                    className="flex-1 h-9 px-3 rounded-lg border border-[#DDD6FE]/40 dark:border-white/10 bg-white dark:bg-[#1A1A35] text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomColor}
                    className="h-9 px-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer border-none shadow-sm"
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
            <div className="bg-white dark:bg-[#141428] rounded-2xl shadow-sm border border-[#DDD6FE]/40 dark:border-white/10 p-6 flex flex-col gap-4">
              <h3 className="text-sm font-black text-[#6D28D9] dark:text-[#A78BFA] uppercase tracking-wider flex items-center gap-2 border-b border-[#DDD6FE]/20 dark:border-white/5 pb-3">
                <ImageIcon size={18} /> Media Files
              </h3>
              
              {/* Drag zone */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('add-multiple-file-input')?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-2.5 ${
                  dragActive 
                    ? "border-[#7C3AED] bg-[#7C3AED]/5" 
                    : fieldErrors.images 
                      ? "border-red-500 bg-red-500/5" 
                      : "border-[#DDD6FE]/60 dark:border-white/10 bg-[#EEF0F8]/30 dark:bg-[#1A1A35]/30 hover:bg-[#e6e8eb] dark:hover:bg-[#363636]"
                }`}
              >
                <Upload size={28} className="text-[#7C3AED] animate-bounce" />
                <div>
                  <p className="text-xs font-bold text-[#1E1B4B] dark:text-white">Drag &amp; drop product images</p>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5">or click to browse from device</p>
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

              {/* Upload Previews */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {images.map((img, idx) => (
                    <div 
                      key={idx} 
                      className={`relative aspect-square rounded-xl overflow-hidden border ${
                        idx === 0 ? "border-2 border-[#7C3AED]" : "border-[#DDD6FE]/40"
                      } group`}
                    >
                      <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeleteImage(idx); }}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700 cursor-pointer border-none opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={10} />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 bg-[#7C3AED] text-white text-[8px] font-black px-1.5 py-0.5 rounded">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Organization & Category selection card */}
            <div className="bg-white dark:bg-[#141428] rounded-2xl shadow-sm border border-[#DDD6FE]/40 dark:border-white/10 p-6 flex flex-col gap-4">
              <h3 className="text-sm font-black text-[#6D28D9] dark:text-[#A78BFA] uppercase tracking-wider flex items-center gap-2 border-b border-[#DDD6FE]/20 dark:border-white/5 pb-3">
                <Tag size={18} /> Organization
              </h3>

              <div className="flex flex-col gap-3">
                {/* Category select */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#4B5563] dark:text-[#C4B5FD]">Catalog Category</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-[#DDD6FE]/40 dark:border-white/10 bg-white dark:bg-[#1A1A35] text-xs font-semibold outline-none cursor-pointer"
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

        {/* Dynamic SKU & Variants Editor Grid */}
        {generatedVariants.length > 0 && (
          <div className="bg-white dark:bg-[#141428] rounded-2xl shadow-sm border border-[#DDD6FE]/40 dark:border-white/10 p-6 flex flex-col gap-4 mt-2">
            <div className="flex justify-between items-center flex-wrap gap-4 border-b border-[#DDD6FE]/20 dark:border-white/5 pb-3">
              <div>
                <h3 className="text-sm font-black text-[#1E1B4B] dark:text-white uppercase tracking-wider">Generated Stock Variants</h3>
                <p className="text-[11px] text-[#9CA3AF] font-medium mt-1">Audit or overwrite default pricing and stock items per size/color.</p>
              </div>
              <span className="text-xs font-extrabold text-[#7C3AED] bg-[#EDE9FE]/30 px-3 py-1 rounded-full border border-[#7C3AED]/20">
                Total Stock Count: {totalCalculatedStock} units
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#DDD6FE]/30 text-xs font-bold text-[#9CA3AF]">
                    <th className="p-3">Color / Size Variant</th>
                    <th className="p-3">SKU Code</th>
                    <th className="p-3 w-40">Stock Units</th>
                    <th className="p-3 w-48">Variant Price (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDD6FE]/20 dark:divide-white/5">
                  {generatedVariants.map((v, idx) => (
                    <tr key={`${v.color}_${v.size}_${idx}`} className="text-xs">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full border border-gray-400" style={{ backgroundColor: v.color.toLowerCase() }}></span>
                          <span className="font-bold text-[#4B5563] dark:text-[#C4B5FD]">{v.color} / {v.size}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <input 
                          type="text"
                          value={v.sku}
                          onChange={(e) => updateVariantField(v.color, v.size, "sku", e.target.value.toUpperCase())}
                          className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-[#DDD6FE]/40 bg-white dark:bg-[#1A1A35] outline-none"
                        />
                      </td>
                      <td className="p-3">
                        <input 
                          type="number"
                          value={v.stock}
                          min="0"
                          onChange={(e) => updateVariantField(v.color, v.size, "stock", Math.max(0, Number(e.target.value)))}
                          className="w-28 h-8 px-2 text-xs rounded-lg border border-[#DDD6FE]/40 bg-white dark:bg-[#1A1A35] outline-none"
                        />
                      </td>
                      <td className="p-3">
                        <input 
                          type="number"
                          value={v.price}
                          min="0"
                          onChange={(e) => updateVariantField(v.color, v.size, "price", Math.max(0, Number(e.target.value)))}
                          className="w-32 h-8 px-2 text-xs font-bold rounded-lg border border-[#DDD6FE]/40 bg-white dark:bg-[#1A1A35] outline-none text-[#7C3AED]"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto self-start mt-2 px-6 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#7C3AED]/20 disabled:opacity-50 border-none transition-all duration-200"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <FolderPlus size={18} />}
          <span>{saving ? "Publishing Catalog Listing..." : "Publish Product Listing"}</span>
        </button>
      </form>
    </div>
  );
};
export default AdminAddProductTab;
