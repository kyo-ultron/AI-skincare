const SkinAnalysis          = require("../models/SkinAnalysis");
const Notification          = require("../models/Notification");
const WeatherRecommendation = require("../models/WeatherRecommendation");

// GET /api/history?type=analysis|notification|weather&month=&year=&page=&limit=
const getHistory = async (req, res) => {
  try {
    const { type, month, year, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const dateFilter = {};
    if (month && year) {
      dateFilter.createdAt = {
        $gte: new Date(year, month - 1, 1),
        $lt:  new Date(year, month,     1),
      };
    }

    const result = {};

    if (!type || type === "analysis") {
      result.analyses = await SkinAnalysis.find({ userId: req.user._id, ...dateFilter })
        .select("-imageBase64").sort({ createdAt: -1 }).limit(parseInt(limit)).skip(skip);
    }
    if (!type || type === "notification") {
      result.notifications = await Notification.find({ userId: req.user._id, ...dateFilter })
        .sort({ createdAt: -1 }).limit(parseInt(limit)).skip(skip);
    }
    if (!type || type === "weather") {
      result.weather = await WeatherRecommendation.find({ userId: req.user._id, ...dateFilter })
        .sort({ createdAt: -1 }).limit(parseInt(limit)).skip(skip);
    }

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getHistory };