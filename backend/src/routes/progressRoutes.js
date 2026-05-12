const express = require("express");

const router = express.Router();

const {
  saveEntry,
  getDashboard,
  getPhoto,
} = require("../controllers/progressController");

const {
  protect,
} = require("../middleware/authMiddleware");

router.post(
  "/entry",
  protect,
  saveEntry
);

router.get(
  "/dashboard",
  protect,
  getDashboard
);

router.get(
  "/photo/:entryId",
  protect,
  getPhoto
);

module.exports = router;
