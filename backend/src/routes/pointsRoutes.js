const express    = require("express");
const router     = express.Router();
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");

// GET /api/points
router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("points streak badges");
    res.json({ success: true, points: user.points, streak: user.streak, badges: user.badges });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/points/redeem
router.post("/redeem", protect, async (req, res) => {
  try {
    const { amount } = req.body;
    const pts = parseInt(amount);
    if (!pts || pts <= 0) return res.status(400).json({ success: false, message: "Invalid amount" });

    const user = await User.findById(req.user._id);
    if (user.points < pts) return res.status(400).json({ success: false, message: "Insufficient points" });

    user.points -= pts;
    await user.save();

    res.json({ success: true, message: `${pts} points redeemed`, remainingPoints: user.points });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;