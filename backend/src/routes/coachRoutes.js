const express = require("express");
const router = express.Router();
// Ensure these names match the module.exports in your controller exactly
const { 
  sendMessage, 
  getHistory, 
  clearHistory, 
  getGreeting 
} = require("../controllers/coachController");
const { protect } = require("../middleware/authMiddleware");

// The frontend calls /chat, so we point that to the sendMessage function
router.post("/chat", protect, sendMessage); 
router.get("/history", protect, getHistory);
router.delete("/history", protect, clearHistory);
router.get("/greeting", protect, getGreeting);

module.exports = router;