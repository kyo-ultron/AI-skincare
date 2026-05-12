const express = require("express");
const router  = express.Router();
const { getNotifications, createNotification, markRead, markAllRead, deleteNotification } = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/",              getNotifications);      // GET    /api/notifications
router.post("/",             createNotification);    // POST   /api/notifications
router.put("/read-all",      markAllRead);           // PUT    /api/notifications/read-all
router.put("/:id/read",      markRead);              // PUT    /api/notifications/:id/read
router.delete("/:id",        deleteNotification);    // DELETE /api/notifications/:id

module.exports = router;