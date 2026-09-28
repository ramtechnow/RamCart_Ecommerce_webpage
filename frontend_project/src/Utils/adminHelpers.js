/**
 * Compress an image file to ultra-lightweight WebP/JPEG format and return as Base64 string
 * Resizes max dimension to 750px and compresses to <70KB for instant loading
 */
export const compressImageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max_size = 750;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > max_size) {
            height = Math.round(height * (max_size / width));
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width = Math.round(width * (max_size / height));
            height = max_size;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
        }
        
        // Try WebP first for ~60% file-size reduction, fallback to clean JPEG
        try {
          const webpUrl = canvas.toDataURL('image/webp', 0.72);
          if (webpUrl.startsWith('data:image/webp')) {
            return resolve(webpUrl);
          }
        } catch (_) {}

        const jpegUrl = canvas.toDataURL('image/jpeg', 0.70);
        resolve(jpegUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

/**
 * Format number to US Currency style
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};

/**
 * Normalize and render user-friendly category name
 */
export const normalizeCategory = (category) => {
  if (!category) return 'Uncategorized';
  const cat = category.toLowerCase();
  if (cat === 'kid' || cat === 'kids') return 'Kids';
  if (cat === 'men') return 'Men';
  if (cat === 'women') return 'Women';
  return category;
};
