const express = require("express");
const router = express.Router();
const { analyzeImage } = require("../controllers/skinController");
const { protect } = require("../middleware/authMiddleware");

// Protected route — must be logged in to analyze
router.post("/analyze", protect, analyzeImage);

module.exports = router;