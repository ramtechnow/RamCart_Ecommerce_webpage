import { Product } from "../types/productTypes";
import { BACKEND_URL } from "../../../config";

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

    const list: Product[] = data.map((p: any) => {
      const rawCat = (p.category || "").toLowerCase().trim();
      const normCat = (rawCat === "kid" || rawCat === "kids") ? "kids" : rawCat;
      return {
        id: String(p.id),
        name: p.name,
        description: p.description || `Premium quality ${p.name} from RamCart.`,
        category: normCat,
        newPrice: Number(p.new_price || 0),
        oldPrice: Number(p.old_price || 0),
        sizes: p.sizes || ['S', 'M', 'L', 'XL'],
        colors: p.colors || ['Black', 'White'],
        variants: p.variants || [],
        stockCount: Number(p.stockCount || 0),
        image: p.image || "",
        images: p.images || [],
        available: p.available !== false,
        createdAt: p.date
      };
    });

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

// Fetch single product by ID
export const fetchProductById = async (id: string): Promise<Product | null> => {
  const list = await fetchProducts();
  return list.find((p) => p.id === id) || null;
};

// Fetch related products (same category, excluding current product ID)
export const fetchRelatedProducts = async (category: string, excludeId: string): Promise<Product[]> => {
  const list = await fetchProducts(category);
  return list.filter((p) => p.id !== excludeId).slice(0, 4);
};
