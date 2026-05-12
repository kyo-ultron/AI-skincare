/**
 * skinController.js — Normal (on-demand) skin analysis.
 *
 * FIXES:
 * 1. After Gemini returns a result, it now saves to SkinAnalysis collection
 *    so the Dashboard can pick it up immediately.
 * 2. Fires dual-channel notification (in-app + email).
 * 3. Uses deriveScores helper to generate numeric scores for dashboard.
 */

const { analyzeSkin }             = require("../services/skinAnalysisService");
const { getProductsByConditions } = require("../data/products");
const SkinAnalysis                = require("../models/SkinAnalysis");
const { sendAnalysisNotification } = require("./notificationController");

const deriveScores = (analysis = {}) => {
  const conditions = (analysis.conditions || []).map(c => c.toLowerCase());
  const healthMap  = { Excellent: 92, Good: 78, Fair: 58, Poor: 38 };
  const base       = healthMap[analysis.overallHealth] || 58;
  const has        = (kw) => conditions.some(c => c.includes(kw));
  return {
    overall:   base,
    clarity:   Math.max(15, base - (has("acne") || has("breakout") ? 22 : 0)),
    hydration: Math.max(15, base - (has("dry")  ? 25 : 0) + (has("oily") ? 5 : 0)),
    evenness:  Math.max(15, base - (has("pigment") || has("uneven") ? 20 : 0)),
  };
};

const analyzeImage = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ success: false, message: "No image provided" });

    const matches = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches)
      return res.status(400).json({ success: false, message: "Invalid image format" });

    const detectedMediaType = matches[1];
    const base64Data        = matches[2];

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(detectedMediaType))
      return res.status(400).json({ success: false, message: "Unsupported image type. Use JPEG, PNG, or WEBP." });

    console.log(`Analyzing skin image (${detectedMediaType}), base64 length: ${base64Data.length}`);

    const skinAnalysis = await analyzeSkin(base64Data, detectedMediaType);

    console.log("Analysis result:", JSON.stringify(skinAnalysis).substring(0, 200));

    // ── Save to SkinAnalysis so Dashboard sees it ──────────────────────────────
    const scores    = deriveScores(skinAnalysis);
    const count     = await SkinAnalysis.countDocuments({ userId: req.user._id });

    await SkinAnalysis.create({
      userId:      req.user._id,
      imageBase64: base64Data,
      analysis:    skinAnalysis,
      scores,
      isDaily:     false,   // on-demand, not daily
      dayNumber:   count + 1,
      insight:     "Stable",
      analysedAt:  new Date(),
    });

    // ── Dual-channel notification ──────────────────────────────────────────────
    sendAnalysisNotification(
      req.user._id,
      "system",
      `Skin analysis complete. Skin type: ${skinAnalysis.skinType}. Overall health: ${skinAnalysis.overallHealth}.`,
      skinAnalysis
    ).catch(err => console.error("Notification error (non-fatal):", err.message));

    const recommendedProducts = getProductsByConditions(skinAnalysis.conditions || []);

    res.json({
      success:     true,
      analysis:    skinAnalysis,
      products:    recommendedProducts,
      scores,
      analyzedAt:  new Date().toISOString(),
    });
  } catch (error) {
    console.error("=== Skin analysis error ===");
    console.error("Message:", error.message);
    console.error("Stack:",   error.stack);
    res.status(500).json({ success: false, message: "Analysis failed. Please try again with a clearer photo." });
  }
};

module.exports = { analyzeImage };