// Static product catalog mapped to skin conditions
const products = [
  // Acne / Breakouts
  {
    id: "p001",
    name: "CeraVe Acne Foaming Cream Cleanser",
    brand: "CeraVe",
    category: "Cleanser",
    price: "$14.99",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&q=80",
    conditions: ["acne", "breakouts", "oily skin", "clogged pores", "blackheads", "whiteheads"],
    description: "Benzoyl peroxide cleanser that clears acne while being gentle on the skin barrier.",
    keyIngredients: ["Benzoyl Peroxide 4%", "Niacinamide", "Ceramides"],
    rating: 4.5,
  },
  {
    id: "p002",
    name: "Paula's Choice 2% BHA Liquid Exfoliant",
    brand: "Paula's Choice",
    category: "Exfoliant",
    price: "$34.00",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&q=80",
    conditions: ["acne", "blackheads", "clogged pores", "uneven texture", "oily skin"],
    description: "Leave-on BHA that unclogs pores and smooths skin texture without irritation.",
    keyIngredients: ["Salicylic Acid 2%", "Green Tea Extract"],
    rating: 4.8,
  },
  {
    id: "p003",
    name: "La Roche-Posay Effaclar Duo",
    brand: "La Roche-Posay",
    category: "Treatment",
    price: "$36.99",
    image: "https://images.unsplash.com/photo-1586495777744-4e6232e9a5da?w=300&q=80",
    conditions: ["acne", "breakouts", "oily skin", "blackheads"],
    description: "Dual-action acne treatment that targets blemishes and prevents new ones from forming.",
    keyIngredients: ["Benzoyl Peroxide 5.5%", "Niacinamide", "LHA"],
    rating: 4.6,
  },

  // Dryness / Dehydration
  {
    id: "p004",
    name: "Neutrogena Hydro Boost Water Gel",
    brand: "Neutrogena",
    category: "Moisturizer",
    price: "$22.99",
    image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=300&q=80",
    conditions: ["dry skin", "dehydration", "flakiness", "tight skin", "dull skin"],
    description: "Lightweight gel moisturizer that delivers a surge of hydration and locks it in.",
    keyIngredients: ["Hyaluronic Acid", "Dimethicone", "Glycerin"],
    rating: 4.7,
  },
  {
    id: "p005",
    name: "The Ordinary Hyaluronic Acid 2% + B5",
    brand: "The Ordinary",
    category: "Serum",
    price: "$9.90",
    image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&q=80",
    conditions: ["dry skin", "dehydration", "fine lines", "dull skin", "tight skin"],
    description: "Multi-depth hyaluronic acid serum with vitamin B5 for intense hydration.",
    keyIngredients: ["Hyaluronic Acid", "Vitamin B5", "Glycerin"],
    rating: 4.5,
  },
  {
    id: "p006",
    name: "First Aid Beauty Ultra Repair Cream",
    brand: "First Aid Beauty",
    category: "Moisturizer",
    price: "$38.00",
    image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300&q=80",
    conditions: ["dry skin", "eczema", "flakiness", "sensitive skin", "irritation"],
    description: "Intense moisturizer for dry, distressed skin with colloidal oatmeal.",
    keyIngredients: ["Colloidal Oatmeal", "Shea Butter", "Ceramides"],
    rating: 4.8,
  },

  // Hyperpigmentation / Dark Spots
  {
    id: "p007",
    name: "TruSkin Vitamin C Serum",
    brand: "TruSkin",
    category: "Serum",
    price: "$19.99",
    image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab12?w=300&q=80",
    conditions: ["hyperpigmentation", "dark spots", "uneven skin tone", "dull skin", "sun damage"],
    description: "Brightening vitamin C serum that fades dark spots and evens skin tone.",
    keyIngredients: ["Vitamin C 20%", "Vitamin E", "Hyaluronic Acid"],
    rating: 4.4,
  },
  {
    id: "p008",
    name: "Murad Rapid Age Spot Correcting Serum",
    brand: "Murad",
    category: "Serum",
    price: "$76.00",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&q=80",
    conditions: ["hyperpigmentation", "dark spots", "age spots", "uneven skin tone", "sun damage"],
    description: "Clinically proven to reduce the appearance of dark spots in just 2 weeks.",
    keyIngredients: ["Glycolic Acid", "Tranexamic Acid", "Niacinamide"],
    rating: 4.6,
  },

  // Aging / Wrinkles
  {
    id: "p009",
    name: "RoC Retinol Correxion Line Smoothing Serum",
    brand: "RoC",
    category: "Serum",
    price: "$29.97",
    image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&q=80",
    conditions: ["wrinkles", "fine lines", "aging", "loss of firmness", "crow's feet"],
    description: "Clinically proven retinol serum that visibly reduces fine lines and wrinkles.",
    keyIngredients: ["Retinol", "Glycerin", "Vitamin E"],
    rating: 4.5,
  },
  {
    id: "p010",
    name: "Olay Regenerist Micro-Sculpting Cream",
    brand: "Olay",
    category: "Moisturizer",
    price: "$28.99",
    image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=300&q=80",
    conditions: ["wrinkles", "fine lines", "aging", "loss of firmness", "dull skin"],
    description: "Advanced anti-aging moisturizer that firms and plumps skin.",
    keyIngredients: ["Niacinamide", "Hyaluronic Acid", "Amino-Peptide Complex"],
    rating: 4.7,
  },

  // Redness / Sensitivity
  {
    id: "p011",
    name: "La Roche-Posay Toleriane Double Repair",
    brand: "La Roche-Posay",
    category: "Moisturizer",
    price: "$22.99",
    image: "https://images.unsplash.com/photo-1586495777744-4e6232e9a5da?w=300&q=80",
    conditions: ["redness", "sensitive skin", "rosacea", "irritation", "reactive skin"],
    description: "Lightweight moisturizer designed for sensitive skin that restores the barrier.",
    keyIngredients: ["Niacinamide", "Ceramides", "Prebiotic Thermal Water"],
    rating: 4.8,
  },
  {
    id: "p012",
    name: "Avene Antirougeurs Fort Relief Concentrate",
    brand: "Avène",
    category: "Treatment",
    price: "$42.00",
    image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300&q=80",
    conditions: ["redness", "rosacea", "diffuse redness", "sensitive skin"],
    description: "Concentrated serum specifically formulated to reduce persistent redness.",
    keyIngredients: ["Ruscogenins", "Vitamin K", "Avène Thermal Spring Water"],
    rating: 4.4,
  },

  // Oily Skin / Large Pores
  {
    id: "p013",
    name: "Innisfree No Sebum Mineral Powder",
    brand: "Innisfree",
    category: "Powder",
    price: "$8.00",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&q=80",
    conditions: ["oily skin", "large pores", "shine control", "excess sebum"],
    description: "Ultra-fine mineral powder that absorbs excess oil and minimizes pores.",
    keyIngredients: ["Jeju Volcanic Ash", "Mineral Powder"],
    rating: 4.5,
  },
  {
    id: "p014",
    name: "Peter Thomas Roth Pores Be Gone Matte Primer",
    brand: "Peter Thomas Roth",
    category: "Primer",
    price: "$39.00",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&q=80",
    conditions: ["oily skin", "large pores", "uneven texture", "shine control"],
    description: "Oil-free primer that minimizes pores and creates a smooth matte finish.",
    keyIngredients: ["Dimethicone", "Silica", "Niacinamide"],
    rating: 4.3,
  },

  // Sun Damage / SPF
  {
    id: "p015",
    name: "EltaMD UV Clear Broad-Spectrum SPF 46",
    brand: "EltaMD",
    category: "Sunscreen",
    price: "$39.00",
    image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&q=80",
    conditions: ["sun damage", "hyperpigmentation", "acne", "sensitive skin", "rosacea"],
    description: "Lightweight, oil-free SPF with niacinamide for acne-prone and sensitive skin.",
    keyIngredients: ["Zinc Oxide 9%", "Niacinamide", "Hyaluronic Acid"],
    rating: 4.9,
  },

  // Under-eye / Puffiness
  {
    id: "p016",
    name: "Kiehl's Creamy Eye Treatment with Avocado",
    brand: "Kiehl's",
    category: "Eye Cream",
    price: "$51.00",
    image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab12?w=300&q=80",
    conditions: ["dark circles", "puffiness", "under-eye bags", "dry eye area", "fine lines"],
    description: "Rich eye cream that deeply hydrates the delicate under-eye area.",
    keyIngredients: ["Avocado Oil", "Beta-Carotene", "Shea Butter"],
    rating: 4.6,
  },
];

// Get products by skin conditions detected
const getProductsByConditions = (conditions) => {
  if (!conditions || conditions.length === 0) return products.slice(0, 4);

  const normalizedConditions = conditions.map((c) => c.toLowerCase().trim());

  // Score products by how many conditions they match
  const scored = products.map((product) => {
    const matches = product.conditions.filter((c) =>
      normalizedConditions.some(
        (nc) => c.includes(nc) || nc.includes(c) || nc.split(" ").some((word) => c.includes(word))
      )
    ).length;
    return { ...product, matchScore: matches };
  });

  // Sort by match score, then get top results
  const matched = scored
    .filter((p) => p.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6);

  // If fewer than 3 matched, pad with general recommendations
  if (matched.length < 3) {
    const generalPicks = [products[3], products[14], products[0]].filter(
      (p) => !matched.find((m) => m.id === p.id)
    );
    return [...matched, ...generalPicks].slice(0, 6);
  }

  return matched;
};

module.exports = { products, getProductsByConditions };