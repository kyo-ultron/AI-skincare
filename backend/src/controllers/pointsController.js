const User = require("../models/User");

// @route GET /api/points
const getPoints = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("points streak badges lastLoginDate");
    res.json({
      success: true,
      points: user.points,
      streak: user.streak,
      badges: user.badges,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/points/redeem  (placeholder for future reward shop)
const redeemPoints = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user._id);

    if (!amount || amount <= 0)
      return res.status(400).json({ success: false, message: "Invalid redemption amount" });

    if (user.points < amount)
      return res.status(400).json({ success: false, message: "Insufficient points" });

    user.points -= amount;
    await user.save();

    res.json({ success: true, message: `${amount} points redeemed`, remainingPoints: user.points });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getPoints, redeemPoints };