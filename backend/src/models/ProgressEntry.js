const mongoose = require("mongoose");

const progressEntrySchema = new mongoose.Schema({
  // FIXED: Removed unique:true — a user needs many entries (one per analysis).
  // The old schema with unique:true meant only the first entry was ever saved;
  // every subsequent save silently failed with a duplicate-key error.
  userId: {
    type: String,
    required: true,
    index: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  dayNumber: {
    type: Number,
    required: true,
  },
  isOnboarding: {
    type: Boolean,
    default: false,
  },
  photoIndex: {
    type: Number,
    default: 0,
  },
  imageBase64: {
    type: String,
    required: true,
  },
  analysis: {
    skinType: String,
    overallHealth: String,
    severity: String,
    conditions: [String],
    recommendations: [String],
    avoidIngredients: [String],
    analysis: String,
  },
  scores: {
    hydration: Number,
    clarity: Number,
    evenness: Number,
    overall: Number,
  },
}, { timestamps: true });

module.exports = mongoose.model("ProgressEntry", progressEntrySchema);