import { Product } from "../types/productTypes";
import { BACKEND_URL } from "../../../config";

// Sanitize image URLs to ensure valid HTTPS protocol and absolute paths
const sanitizeImg = (imgUrl: any): string => {
  if (!imgUrl || typeof imgUrl !== "string") return "";
  let trimmed = imgUrl.trim();
  if (trimmed.startsWith("http://frontend-project-jucn.onrender.com")) {
    trimmed = trimmed.replace("http://", "https://");
  } else if (trimmed.startsWith("http://localhost:4000")) {
    trimmed = trimmed.replace("http://localhost:4000", BACKEND_URL);
  } else if (trimmed.startsWith("/images/")) {
    trimmed = `${BACKEND_URL}${trimmed}`;
  }
  return trimmed;
};

// Reusable mapper to ensure consistent product schema
const mapRawProduct = (p: any): Product => {
  const rawCat = (p.category || "").toLowerCase().trim();
  const normCat = (rawCat === "kid" || rawCat === "kids") ? "kids" : rawCat;
  
  const rawVariants = Array.isArray(p.variants) ? p.variants : [];
  const mappedVariants = rawVariants.map((v: any) => ({
    sku: v.sku || "",
    size: String(v.size || "").trim(),
    color: v.color || "",
    stock: v.stock !== undefined ? Number(v.stock) : 10,
    price: v.price !== undefined && v.price !== null ? Number(v.price) : Number(p.new_price || 0),
    oldPrice: v.old_price !== undefined && v.old_price !== null 
      ? Number(v.old_price) 
      : (v.oldPrice !== undefined && v.oldPrice !== null ? Number(v.oldPrice) : Number(p.old_price || 0)),
    old_price: v.old_price !== undefined && v.old_price !== null 
      ? Number(v.old_price) 
      : (v.oldPrice !== undefined && v.oldPrice !== null ? Number(v.oldPrice) : Number(p.old_price || 0))
  }));

  const primaryImage = sanitizeImg(p.image);
  const additionalImages = (Array.isArray(p.images) ? p.images : [])
    .map(sanitizeImg)
    .filter(Boolean);

  return {
    id: String(p.id !== undefined && p.id !== null ? p.id : (p._id || "")),
    name: p.name || "",
    description: p.description || `Premium quality ${p.name} from RamCart.`,
    category: normCat,
    newPrice: Number(p.new_price || 0),
    oldPrice: Number(p.old_price || 0),
    sizes: p.sizes && Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ['S', 'M', 'L', 'XL'],
    colors: p.colors && Array.isArray(p.colors) && p.colors.length > 0 ? p.colors : ['Black', 'White'],
    variants: mappedVariants,
    stockCount: Number(p.stockCount || 0),
    image: primaryImage,
    images: additionalImages.length > 0 ? additionalImages : (primaryImage ? [primaryImage] : []),
    available: p.available !== false,
    createdAt: p.date
  };
};

// Fetch all available products — NO dummy fallback, only real MongoDB data
export const fetchProducts = async (category?: string): Promise<Product[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for cold starts

  try {
    const res = await fetch(`${BACKEND_URL}/allproducts`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error("Failed to fetch products from backend");
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return []; // Empty catalog — no fake data
    }

    const list: Product[] = data.map(mapRawProduct);

    if (category) {
      const target = category.toLowerCase().trim();
      const normalizedTarget = (target === "kid" || target === "kids") ? "kids" : target;
      return list.filter((p) => p.category.toLowerCase() === normalizedTarget);
    }

    return list;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn("fetchProducts: Backend unavailable or cold-starting. Returning empty catalog.", err);
    return []; // No dummy data — skeleton/loading state will show instead
  }
};

// Fetch single product by ID (fast direct endpoint with fallback)
export const fetchProductById = async (id: string): Promise<Product | null> => {
  if (!id) return null;

  // 1. Try fast direct single product lookup from backend first
  try {
    const res = await fetch(`${BACKEND_URL}/product/${encodeURIComponent(id)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.product) {
        return mapRawProduct(data.product);
      }
    }
  } catch (err) {
    console.warn("Direct fetchProductById failed, falling back to catalog search:", err);
  }

  // 2. Fallback to full catalog lookup
  const list = await fetchProducts();
  const targetId = String(id).trim().toLowerCase();
  return list.find((p) => {
    const pid = String(p.id).trim().toLowerCase();
    const pMongoId = String((p as any)._id || "").trim().toLowerCase();
    return pid === targetId || pMongoId === targetId;
  }) || null;
};

// Fetch related products (same category, excluding current product ID)
export const fetchRelatedProducts = async (category: string, excludeId: string): Promise<Product[]> => {
  const list = await fetchProducts(category);
  return list.filter((p) => String(p.id) !== String(excludeId)).slice(0, 4);
};
