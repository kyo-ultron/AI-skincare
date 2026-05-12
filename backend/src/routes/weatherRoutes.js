const express = require("express");
const router = express.Router();
const { getWeather, getWeatherHistory } = require("../controllers/weatherController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/", getWeather);
router.get("/history", getWeatherHistory);

module.exports = router;
