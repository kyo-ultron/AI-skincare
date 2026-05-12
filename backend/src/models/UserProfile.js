const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema({
  // ✅ FIX: Was "uuserId" (double-u typo) — this caused ALL profile lookups by
  // userId to return null, breaking the dashboard and coach context entirely.
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  onboardingComplete: {
    type: Boolean,
    default: false,
  },
  onboardingPhotos: {
    type: Number,
    default: 0,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  currentDay: {
    type: Number,
    default: 1,
  },
  baselineConditions: [String],
  baselineHealth: String,
  streak: {
    type: Number,
    default: 0,
  },
  lastEntryDate: Date,
}, { timestamps: true });

module.exports = mongoose.model("UserProfile", userProfileSchema);