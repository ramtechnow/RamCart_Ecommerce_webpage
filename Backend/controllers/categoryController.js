const CategoryCard = require('../models/CategoryCard');

const DEFAULT_CATEGORY_CARDS = [
  {
    categoryKey: 'women',
    name: "Women's Collection",
    title: "Women's Haute & Festive Edit",
    subtitle: "Ethereal ethnic sets, chic contemporary dresses, flowy tops & premium layering.",
    badgeText: "🔥 380+ Trending Styles",
    tagline: "SIGNATURE EDIT",
    image: "/women_category.png",
    link: "/womens",
    objectPosition: "top"
  },
  {
    categoryKey: 'men',
    name: "Men's Collection",
    title: "Men's Modern Essentials",
    subtitle: "Sharp blazers, organic polos & tailored street chinos.",
    badgeText: "👔 245+ Sharp Fits",
    tagline: "SMART CASUALS",
    image: "/men_category.png",
    link: "/mens",
    objectPosition: "top"
  },
  {
    categoryKey: 'kids',
    name: "Kids Collection",
    title: "Kids & Junior Wardrobe",
    subtitle: "Cozy dungarees, festive dresses & active wear.",
    badgeText: "🧸 180+ Playful Picks",
    tagline: "PLAY & COMFORT",
    image: "/kids_category.png",
    link: "/kids",
    objectPosition: "top"
  }
];

// Public: Get all category showcase cards (seeds if none exist)
exports.getCategoryCards = async (req, res) => {
  try {
    let cards = await CategoryCard.find({});
    
    if (!cards || cards.length === 0) {
      console.log('Seeding initial default Category Cards in MongoDB...');
      cards = await CategoryCard.insertMany(DEFAULT_CATEGORY_CARDS);
    }
    
    // Ensure all 3 categories exist
    const keysPresent = cards.map(c => c.categoryKey);
    const missing = DEFAULT_CATEGORY_CARDS.filter(d => !keysPresent.includes(d.categoryKey));
    if (missing.length > 0) {
      const added = await CategoryCard.insertMany(missing);
      cards = [...cards, ...added];
    }

    // Sort order: women, men, kids
    const order = ['women', 'men', 'kids'];
    cards.sort((a, b) => order.indexOf(a.categoryKey) - order.indexOf(b.categoryKey));

    res.json({ success: true, cards });
  } catch (err) {
    console.error("Error fetching category cards:", err);
    res.status(500).json({ success: false, error: "Failed to fetch category cards", fallback: DEFAULT_CATEGORY_CARDS });
  }
};

// Admin: Update a category showcase card
exports.updateCategoryCard = async (req, res) => {
  try {
    const { categoryKey, name, title, subtitle, badgeText, tagline, image, link, objectPosition } = req.body;

    if (!categoryKey || !['women', 'men', 'kids'].includes(categoryKey)) {
      return res.status(400).json({ success: false, error: "Valid categoryKey (women, men, or kids) is required" });
    }

    const updateData = {
      updatedAt: new Date()
    };
    if (name !== undefined) updateData.name = name;
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (badgeText !== undefined) updateData.badgeText = badgeText;
    if (tagline !== undefined) updateData.tagline = tagline;
    if (image !== undefined) updateData.image = image;
    if (link !== undefined) updateData.link = link;
    if (objectPosition !== undefined) updateData.objectPosition = objectPosition;

    const card = await CategoryCard.findOneAndUpdate(
      { categoryKey },
      { $set: updateData },
      { new: true, upsert: true }
    );

    console.log(`Updated Category Card for ${categoryKey}`);
    res.json({ success: true, card, message: `${card.name || categoryKey} updated successfully` });
  } catch (err) {
    console.error("Error updating category card:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to update category card" });
  }
};

// Admin: Reset category showcase cards to factory default
exports.resetCategoryCards = async (req, res) => {
  try {
    await CategoryCard.deleteMany({});
    const cards = await CategoryCard.insertMany(DEFAULT_CATEGORY_CARDS);
    res.json({ success: true, cards, message: "Category cards reset to defaults" });
  } catch (err) {
    console.error("Error resetting category cards:", err);
    res.status(500).json({ success: false, error: "Failed to reset category cards" });
  }
};
