/**
 * authMiddleware.js
 *
 * FIX: Now imports User from models/User.js directly instead of from
 * authController.js. This eliminates the circular dependency risk and
 * ensures both middleware and controllers operate on the same model instance.
 */

const jwt  = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer "))
      return res.status(401).json({ success: false, message: "Not authorized – no token" });

    const token   = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch full Mongoose document so controllers can call user.save()
    const user = await User.findById(decoded.id).select("-password");
    if (!user)
      return res.status(401).json({ success: false, message: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(401).json({ success: false, message: "Not authorized – token failed" });
  }
};

module.exports = { protect };