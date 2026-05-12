const mongoose = require("mongoose");

/**
 * SkinAnalysis – stores EVERY analysis (both on-demand and daily).
 *
 * Key fields:
 *  isDaily     → true  = counted in daily streak / progress chart
 *  scores      → derived 0-100 scores used by dashboard chart
 *  insight     → human-readable insight tag
 */
const skinAnalysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

  imageBase64: { type: String, required: true },

  // Raw Gemini analysis object
  analysis: {
    skinType:         String,
    overallHealth:    String,
    severity:         String,
    conditions:       [String],
    recommendations:  [String],
    avoidIngredients: [String],
    analysis:         String,
  },

  // Derived numeric scores (0-100)
  scores: {
    hydration: { type: Number, default: 50 },
    clarity:   { type: Number, default: 50 },
    evenness:  { type: Number, default: 50 },
    overall:   { type: Number, default: 50 },
  },

  isDaily:   { type: Boolean, default: false },
  dayNumber: { type: Number,  default: 1 },

  insight: {
    type: String,
    enum: ["Skin improving", "Hydration improved", "Acne reduced", "Needs consistency", "Stable"],
    default: "Stable",
  },

  analysedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.models.SkinAnalysis || mongoose.model("SkinAnalysis", skinAnalysisSchema);