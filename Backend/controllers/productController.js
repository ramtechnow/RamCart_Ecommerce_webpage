const mongoose = require('mongoose');
const Product = require('../models/Product');

// Add a new product (Admin Only)
exports.addProduct = async (req, res) => {
  try {
    const lastProduct = await Product.findOne({}, { id: 1 }).sort({ id: -1 });
    const id = lastProduct ? lastProduct.id + 1 : 1;
    
    const variantsInput = Array.isArray(req.body.variants) ? req.body.variants.map(v => ({
      size: v.size || "",
      color: v.color || "Standard",
      stock: Number(v.stock !== undefined ? v.stock : 0),
      price: Number(v.price !== undefined ? v.price : (req.body.new_price || 0)),
      old_price: Number(v.old_price !== undefined ? v.old_price : (v.oldPrice !== undefined ? v.oldPrice : (req.body.old_price || 0)))
    })) : [];

    const product = new Product({
      id: id,
      name: req.body.name,
      image: req.body.image,
      category: req.body.category,
      new_price: req.body.new_price,
      old_price: req.body.old_price,
      sizes: req.body.sizes,
      colors: req.body.colors,
      variants: variantsInput,
      stockCount: variantsInput.length > 0 ? variantsInput.reduce((sum, v) => sum + Number(v.stock), 0) : Number(req.body.stockCount || 100),
      images: req.body.images || [],
      description: req.body.description || "",
    });
    
    await product.save();
    console.log("Saved Product successfully:", req.body.name);
    res.json({
      success: true,
      name: req.body.name,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Remove a product (Admin Only)
exports.removeProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findOneAndDelete({ id: req.body.id });
    if (deletedProduct) {
      console.log("Removed Product successfully:", deletedProduct.name);
      res.json({
        success: true,
        name: deletedProduct.name,
      });
    } else {
      res.status(404).json({ success: false, error: "Product not found" });
    }
  } catch (error) {
    console.error("Error removing product:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    let products = await Product.find({}).sort({ date: -1 });
    
    // Dynamically replace the image host with the current request's host and protocol
    const host = req.get('host');
    const protocol = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('192.168.') || host.includes('10.') ? req.protocol : 'https';
    
    const updatedProducts = products.map(prod => {
      const prodObj = prod.toObject();
      
      // Host remapper
      if (prodObj.image && prodObj.image.includes('/images/')) {
        const imageName = prodObj.image.split('/images/')[1];
        prodObj.image = `${protocol}://${host}/images/${imageName}`;
      }

      if (prodObj.images && Array.isArray(prodObj.images)) {
        prodObj.images = prodObj.images.map(img => {
          if (img && img.includes('/images/')) {
            const imgName = img.split('/images/')[1];
            return `${protocol}://${host}/images/${imgName}`;
          }
          return img;
        });
      }
      
      // Ensure all variants have size, price, and old_price
      if (!prodObj.variants || prodObj.variants.length === 0) {
        const sizes = prodObj.sizes && prodObj.sizes.length > 0 ? prodObj.sizes : ['S', 'M', 'L', 'XL'];
        const colors = prodObj.colors && prodObj.colors.length > 0 ? prodObj.colors : ['Black', 'White'];
        const totalStock = prodObj.stockCount !== undefined ? prodObj.stockCount : 100;
        const stockPerSize = Math.floor(totalStock / sizes.length);
        
        prodObj.variants = sizes.map((s, idx) => ({
          size: s,
          color: colors[0] || 'Standard',
          stock: idx === sizes.length - 1 ? totalStock - (stockPerSize * (sizes.length - 1)) : stockPerSize,
          price: prodObj.new_price,
          old_price: prodObj.old_price || Math.round(prodObj.new_price * 1.3)
        }));
      } else {
        prodObj.variants = prodObj.variants.map((v, idx) => ({
          ...v,
          size: v.size || (prodObj.sizes && prodObj.sizes[idx % prodObj.sizes.length]) || 'M',
          price: Number(v.price !== undefined ? v.price : prodObj.new_price),
          old_price: Number(v.old_price !== undefined ? v.old_price : (v.oldPrice !== undefined ? v.oldPrice : (prodObj.old_price || Math.round((v.price || prodObj.new_price) * 1.3))))
        }));
      }
      
      return prodObj;
    });

    console.log("All Products fetched and host-mapped dynamically with variants fallback");
    res.send(updatedProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get single product by ID (numeric id or MongoDB _id)
exports.getProductById = async (req, res) => {
  try {
    const rawId = req.params.id;
    const isNum = !isNaN(Number(rawId));
    const isValidObjectId = mongoose.Types.ObjectId.isValid(rawId);

    const conditions = [];
    if (isNum) conditions.push({ id: Number(rawId) });
    if (isValidObjectId) conditions.push({ _id: rawId });

    if (conditions.length === 0) {
      return res.status(404).json({ success: false, error: "Invalid product ID format" });
    }

    const prod = await Product.findOne({ $or: conditions });
    if (!prod) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    const host = req.get('host');
    const protocol = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('192.168.') || host.includes('10.') ? req.protocol : 'https';
    const prodObj = prod.toObject();

    if (prodObj.image && prodObj.image.includes('/images/')) {
      const imageName = prodObj.image.split('/images/')[1];
      prodObj.image = `${protocol}://${host}/images/${imageName}`;
    }

    if (prodObj.images && Array.isArray(prodObj.images)) {
      prodObj.images = prodObj.images.map(img => {
        if (img && img.includes('/images/')) {
          const imgName = img.split('/images/')[1];
          return `${protocol}://${host}/images/${imgName}`;
        }
        return img;
      });
    }

    // Ensure all variants have size, price, and old_price
    if (!prodObj.variants || prodObj.variants.length === 0) {
      const sizes = prodObj.sizes && prodObj.sizes.length > 0 ? prodObj.sizes : ['S', 'M', 'L', 'XL'];
      const colors = prodObj.colors && prodObj.colors.length > 0 ? prodObj.colors : ['Black', 'White'];
      const totalStock = prodObj.stockCount !== undefined ? prodObj.stockCount : 100;
      const stockPerSize = Math.floor(totalStock / sizes.length);
      
      prodObj.variants = sizes.map((s, idx) => ({
        size: s,
        color: colors[0] || 'Standard',
        stock: idx === sizes.length - 1 ? totalStock - (stockPerSize * (sizes.length - 1)) : stockPerSize,
        price: prodObj.new_price,
        old_price: prodObj.old_price || Math.round(prodObj.new_price * 1.3)
      }));
    } else {
      prodObj.variants = prodObj.variants.map((v, idx) => ({
        ...v,
        size: v.size || (prodObj.sizes && prodObj.sizes[idx % prodObj.sizes.length]) || 'M',
        price: Number(v.price !== undefined ? v.price : prodObj.new_price),
        old_price: Number(v.old_price !== undefined ? v.old_price : (v.oldPrice !== undefined ? v.oldPrice : (prodObj.old_price || Math.round((v.price || prodObj.new_price) * 1.3))))
      }));
    }

    res.json({ success: true, product: prodObj });
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { 
      id, 
      name, 
      new_price, 
      old_price, 
      variants, 
      stockCount, 
      image, 
      images, 
      category, 
      colors, 
      sizes, 
      description, 
      available 
    } = req.body;
    
    const updateData = { 
      name, 
      new_price: Number(new_price), 
      old_price: Number(old_price) 
    };
    
    if (image !== undefined) updateData.image = image;
    if (images !== undefined) updateData.images = images;
    if (category !== undefined) updateData.category = category;
    if (colors !== undefined) updateData.colors = colors;
    if (sizes !== undefined) updateData.sizes = sizes;
    if (description !== undefined) updateData.description = description;
    if (available !== undefined) updateData.available = available;
    
    if (variants && Array.isArray(variants)) {
      updateData.variants = variants.map(v => ({
        size: v.size || "",
        color: v.color || "Standard",
        stock: Number(v.stock !== undefined ? v.stock : 0),
        price: Number(v.price !== undefined ? v.price : (new_price || 0)),
        old_price: Number(v.old_price !== undefined ? v.old_price : (v.oldPrice !== undefined ? v.oldPrice : (old_price || 0)))
      }));
      updateData.stockCount = updateData.variants.reduce((sum, v) => sum + Number(v.stock), 0);
      
      // Auto-extract colors and sizes from variants to keep them in sync if not explicitly passed
      if (!colors || colors.length === 0) {
        const extractedColors = [...new Set(updateData.variants.map(v => v.color).filter(Boolean))];
        if (extractedColors.length > 0) updateData.colors = extractedColors;
      }
      if (!sizes || sizes.length === 0) {
        const extractedSizes = [...new Set(updateData.variants.map(v => v.size).filter(Boolean))];
        if (extractedSizes.length > 0) updateData.sizes = extractedSizes;
      }
    } else if (stockCount !== undefined) {
      updateData.stockCount = Number(stockCount);
    }
    
    const updatedProduct = await Product.findOneAndUpdate(
      { id: Number(id) },
      { $set: updateData },
      { new: true }
    );
    
    if (updatedProduct) {
      console.log("Updated Product successfully:", updatedProduct.name);
      res.json({ success: true, product: updatedProduct });
    } else {
      res.status(404).json({ success: false, error: "Product not found" });
    }
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Update stock of a specific variant directly (Admin row auditor)
exports.updateVariantStock = async (req, res) => {
  try {
    const { id, color, change } = req.body;
    
    // Find the product
    const product = await Product.findOne({ id: Number(id) });
    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }
    
    // If product doesn't have variants, synthesize them first
    if (!product.variants || product.variants.length === 0) {
      const colors = product.colors && product.colors.length > 0 ? product.colors : ['Black', 'White'];
      const totalStock = product.stockCount !== undefined ? product.stockCount : 100;
      const stockPerColor = Math.floor(totalStock / colors.length);
      
      product.variants = colors.map((c, idx) => ({
        color: c,
        stock: idx === colors.length - 1 ? totalStock - (stockPerColor * (colors.length - 1)) : stockPerColor,
        price: product.new_price
      }));
    }
    
    // Find the specific color variant
    const variant = product.variants.find(v => v.color.toLowerCase() === color.toLowerCase());
    if (!variant) {
      // Add the color variant if it doesn't exist
      product.variants.push({ color, stock: Math.max(0, Number(change)), price: product.new_price });
    } else {
      // Update the stock count
      variant.stock = Math.max(0, variant.stock + Number(change));
    }
    
    // Sync total stockCount
    product.stockCount = product.variants.reduce((sum, v) => sum + v.stock, 0);
    
    await product.save();
    
    console.log(`Updated variant ${color} stock for product ${product.name} (change: ${change}, new stock: ${variant ? variant.stock : change})`);
    res.json({ success: true, product });
  } catch (error) {
    console.error("Error updating variant stock:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
