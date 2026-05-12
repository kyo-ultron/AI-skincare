const express = require("express");
const router = express.Router();
const { dailyAnalyze, getDailyHistory, getProgress } = require("../controllers/dailyController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);
router.post("/analyze", dailyAnalyze);
router.get("/history", getDailyHistory);
router.get("/progress", getProgress);

module.exports = router;
