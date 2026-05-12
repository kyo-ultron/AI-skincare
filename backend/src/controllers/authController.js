/**
 * authController.js
 *
 * FIXES:
 * 1. The project has TWO User definitions:
 *    - models/User.js  (uses bcrypt pre-save hook, module.exports = mongoose.model("User", ...))
 *    - authController.js (inline schema with mongoose.models.User || mongoose.model(...))
 *    
 *    When both files are required at startup, Mongoose sees two model registrations
 *    for "User". The inline schema in authController always runs first via authMiddleware,
 *    then models/User.js registers again → OverwriteModelError on some Node versions,
 *    or silent dual-model bugs where pointsController (which imports from models/User.js)
 *    and authMiddleware (which imports from authController.js) operate on DIFFERENT
 *    in-memory model instances — one with bcrypt pre-save, one without.
 *
 * FIX: authController.js now imports from models/User.js instead of defining inline.
 *      models/User.js is the single source of truth.
 *      pointsController.js also imports from models/User.js.
 *      Both use mongoose.models.User || mongoose.model(...) guard.
 */

const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");

// ✅ FIX: Import User from the canonical model file — no inline schema here
const User = require("../models/User");

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

/** Award login points + maintain streak — called on every successful login */
const handleLoginRewards = async (user) => {
  const todayStr     = new Date().toDateString();
  const lastStr      = user.lastLoginDate ? new Date(user.lastLoginDate).toDateString() : null;
  const yesterdayStr = new Date(Date.now() - 86_400_000).toDateString();

  if (lastStr === todayStr) return; // already rewarded today

  user.streak        = (lastStr === yesterdayStr) ? (user.streak || 0) + 1 : 1;
  user.points        = (user.points  || 0) + 5;
  user.lastLoginDate = new Date();

  if (user.streak >= 7  && !user.badges.includes("streak_7"))  user.badges.push("streak_7");
  if (user.streak >= 30 && !user.badges.includes("streak_30")) user.badges.push("streak_30");

  await user.save();
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: "Please fill in all fields" });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists)
      return res.status(400).json({ success: false, message: "User already exists with this email" });

    // ✅ models/User.js has a pre-save bcrypt hook — no manual hashing needed here
    const user  = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email, points: user.points, streak: user.streak, badges: user.badges },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Server error during registration" });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: "Please enter email and password" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user)
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    // ✅ uses the comparePassword method defined in models/User.js
    const match = await user.comparePassword(password);
    if (!match)
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    await handleLoginRewards(user);

    const token = generateToken(user._id);
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, points: user.points, streak: user.streak, badges: user.badges },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error during login" });
  }
};

// GET /api/auth/me — restores session on page reload
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({
      success: true,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        points: user.points,
        streak: user.streak,
        badges: user.badges,
        notificationPrefs: user.notificationPrefs,
        location: user.location,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /api/auth/preferences
const updatePreferences = async (req, res) => {
  try {
    const { notificationPrefs, location } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (notificationPrefs) {
      user.notificationPrefs = { ...user.notificationPrefs.toObject?.() ?? user.notificationPrefs, ...notificationPrefs };
    }
    if (location) user.location = location;

    await user.save();
    res.json({ success: true, message: "Preferences saved", user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Export User so authMiddleware.js can still import it from here
//    (authMiddleware does: const { User } = require("../controllers/authController"))
module.exports = { register, login, getMe, updatePreferences, User };