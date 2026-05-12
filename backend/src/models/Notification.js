const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

  type: {
    type: String,
    enum: ["daily_analysis", "skincare_routine", "streak", "product_restock", "weather", "custom", "system"],
    default: "custom",
  },
  message:      { type: String, required: true },
  reminderTime: { type: String },         // "HH:MM" for scheduled reminders
  isEnabled:    { type: Boolean, default: true },
  read:         { type: Boolean, default: false },
  readAt:       { type: Date },
}, { timestamps: true });

module.exports = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);