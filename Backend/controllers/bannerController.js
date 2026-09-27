const Banner = require('../models/Banner');

// Create a new banner (Admin Only)
exports.createBanner = async (req, res) => {
  try {
    const { image, description, targetLink, tag, bankOfferText, discountType, discountValue, page } = req.body;
    if (!image || !description || !targetLink || !page) {
      return res.status(400).json({ success: false, error: "Missing required fields for banner creation" });
    }

    const banner = new Banner({
      image,
      description,
      targetLink,
      tag: tag || 'EARLY BIRD DEALS',
      bankOfferText: bankOfferText || 'Instant Discount on Prepaid Orders*',
      discountType,
      discountValue,
      page
    });

    await banner.save();
    console.log(`🎉 New promotional banner created for page ${page}`);
    res.json({ success: true, banner });
  } catch (error) {
    console.error("Error creating banner:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Update an existing banner (Admin Only)
exports.updateBanner = async (req, res) => {
  try {
    const { bannerId, image, description, targetLink, tag, bankOfferText, discountType, discountValue, page } = req.body;
    if (!bannerId) {
      return res.status(400).json({ success: false, error: "Missing bannerId field" });
    }

    const updated = await Banner.findByIdAndUpdate(
      bannerId,
      { $set: { image, description, targetLink, tag, bankOfferText, discountType, discountValue, page } },
      { new: true }
    );

    if (updated) {
      console.log(`✏️ Banner ${bannerId} updated successfully`);
      res.json({ success: true, banner: updated });
    } else {
      res.status(404).json({ success: false, error: "Banner not found" });
    }
  } catch (error) {
    console.error("Error updating banner:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get all banners (Admin view)
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find({}).sort({ createdAt: -1 });
    res.json(banners);
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Toggle banner status (Admin Only)
exports.toggleBannerStatus = async (req, res) => {
  try {
    const { bannerId, isActive } = req.body;
    const updated = await Banner.findByIdAndUpdate(
      bannerId,
      { $set: { isActive: Boolean(isActive) } },
      { new: true }
    );
    if (updated) {
      res.json({ success: true, banner: updated });
    } else {
      res.status(404).json({ success: false, error: "Banner not found" });
    }
  } catch (error) {
    console.error("Error toggling banner status:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Delete a banner (Admin Only)
exports.deleteBanner = async (req, res) => {
  try {
    const { bannerId } = req.body;
    const deleted = await Banner.findByIdAndDelete(bannerId);
    if (deleted) {
      res.json({ success: true, message: "Banner deleted successfully" });
    } else {
      res.status(404).json({ success: false, error: "Banner not found" });
    }
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get active banners by page name (Public)
exports.getActiveBanners = async (req, res) => {
  try {
    const { page } = req.query;
    const query = { isActive: true };
    if (page) {
      query.page = page;
    }
    const banners = await Banner.find(query).sort({ createdAt: -1 });
    res.json(banners);
  } catch (error) {
    console.error("Error fetching active banners:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
