const mongoose = require("mongoose");

const weatherRecSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  city: String,
  weather: {
    temp:        Number,
    humidity:    Number,
    uvIndex:     { type: Number, default: 0 },
    condition:   String,
    description: String,
    aqi:         Number,
  },
  tips:      [String],
  fetchedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.models.WeatherRecommendation || mongoose.model("WeatherRecommendation", weatherRecSchema);