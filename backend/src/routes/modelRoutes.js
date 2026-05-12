const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const axios = require("axios");

const FLASK_URL = process.env.FLASK_MODEL_URL || "http://localhost:5001";

router.post("/analyze", protect, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ success: false, message: "No image provided" });

    const flaskRes = await axios.post(`${FLASK_URL}/analyze`, { image }, {
      timeout: 30000,
      headers: { "Content-Type": "application/json" }
    });

    return res.json(flaskRes.data);
  } catch (err) {
    console.error("Flask model error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Model analysis failed. Make sure the Python service is running."
    });
  }
});

module.exports = router;