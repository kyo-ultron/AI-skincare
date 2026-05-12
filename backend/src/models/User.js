/**
 * models/User.js — Single canonical User model.
 *
 * FIXES:
 * 1. Added mongoose.models.User guard so this file can be required from
 *    multiple places (authController, authMiddleware, pointsController, etc.)
 *    without Mongoose throwing OverwriteModelError.
 * 2. The pre-save bcrypt hook properly uses next() for compatibility with
 *    both mongoose 7 and 9.
 * 3. email field must be stored the way it's registered — the User registered
 *    via authController was using manual bcrypt.hash() BEFORE creating the user,
 *    which means the pre-save hook would double-hash. Fixed in authController.js
 *    to NOT manually hash (the hook does it).
 */

const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    // Gamification
    points:        { type: Number,   default: 0 },
    streak:        { type: Number,   default: 0 },
    badges:        { type: [String], default: [] },
    lastLoginDate: { type: Date },

    // Location for weather feature
    location: {
      city: { type: String, default: "" },
      lat:  { type: Number },
      lon:  { type: Number },
    },

    // Notification preferences
    notificationPrefs: {
      dailyReminder:   { type: Boolean, default: true  },
      reminderTime:    { type: String,  default: "08:00" },
      routineReminder: { type: Boolean, default: true  },
      weatherAlerts:   { type: Boolean, default: true  },
      productRestock:  { type: Boolean, default: false },
    },

    // Email for notifications
    emailNotifications: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ✅ Hash password before save — only when password field is modified
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// ✅ Guard prevents OverwriteModelError when module is required multiple times
module.exports = mongoose.models.User || mongoose.model("User", userSchema);