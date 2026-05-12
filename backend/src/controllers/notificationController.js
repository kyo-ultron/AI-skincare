/**
 * notificationController.js
 *
 * FIXES / NEW FEATURES:
 * 1. Added dual-channel notifications: in-app (MongoDB) + email (Nodemailer).
 * 2. sendAnalysisNotification() is the shared helper called by:
 *    - dailyController  (after daily analysis completes)
 *    - skinController   (after normal analysis completes)
 *    It saves an in-app notification AND sends an email if the user
 *    has emailNotifications enabled (default: true).
 * 3. Email uses Gmail SMTP via Nodemailer. Set EMAIL_USER + EMAIL_PASS in .env.
 *    If env vars are missing, email is skipped silently — app still works.
 * 4. All existing CRUD endpoints unchanged.
 */

const Notification = require("../models/Notification");
const User         = require("../models/User");

// ─── Nodemailer setup ──────────────────────────────────────────────────────────
let transporter = null;

const getTransporter = () => {
  // Lazy init — only create if env vars exist
  if (transporter) return transporter;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️  EMAIL_USER / EMAIL_PASS not set — email notifications disabled");
    return null;
  }
  const nodemailer = require("nodemailer");
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,  // App Password (not your Gmail login password)
    },
  });
  return transporter;
};

// ─── Shared helper — call from other controllers ───────────────────────────────
/**
 * sendAnalysisNotification
 * Creates an in-app notification and (optionally) sends an email.
 *
 * @param {ObjectId} userId   - Mongoose user _id
 * @param {string}   type     - Notification type (see Notification model enum)
 * @param {string}   message  - Short in-app message
 * @param {object}   analysis - Full Gemini analysis object (for email body)
 */
const sendAnalysisNotification = async (userId, type, message, analysis = null) => {
  try {
    // ── 1. In-app notification (always) ──────────────────────────────────────
    await Notification.create({ userId, type, message });

    // ── 2. Email notification (if user opted in and creds exist) ─────────────
    const mailer = getTransporter();
    if (!mailer) return; // email disabled — skip silently

    const user = await User.findById(userId).select("email name emailNotifications");
    if (!user || user.emailNotifications === false) return;

    // Build a readable HTML email
    const conditionsList = analysis?.conditions?.length
      ? analysis.conditions.map(c => `<li>${c}</li>`).join("")
      : "<li>No specific conditions detected</li>";

    const recommendationsList = analysis?.recommendations?.length
      ? analysis.recommendations.map(r => `<li>${r}</li>`).join("")
      : "<li>Maintain your current routine</li>";

    const htmlBody = `
      <div style="font-family:sans-serif;max-width:580px;margin:0 auto;color:#2c2c2c;">
        <div style="background:linear-gradient(135deg,#1a3a2a,#2d6a4f);padding:28px 32px;border-radius:12px 12px 0 0;">
          <h1 style="color:#f8f2e8;margin:0;font-size:1.5rem;">🌿 DermisAI Skin Analysis Complete</h1>
          <p style="color:rgba(232,213,183,0.85);margin:8px 0 0;font-size:0.9rem;">Hi ${user.name}, here are your latest results.</p>
        </div>

        <div style="background:#fdfaf5;padding:28px 32px;border:1px solid #ddd6c7;border-top:none;">
          <table style="width:100%;border-collapse:collapse;margin-bottom:22px;">
            <tr>
              <td style="padding:10px;background:#f0f9f0;border-radius:8px 0 0 8px;font-size:0.82rem;color:#666;text-transform:uppercase;letter-spacing:.05em;width:40%;">Skin Type</td>
              <td style="padding:10px;background:#f0f9f0;font-weight:600;color:#1a3a2a;">${analysis?.skinType || "—"}</td>
            </tr>
            <tr>
              <td style="padding:10px;font-size:0.82rem;color:#666;text-transform:uppercase;letter-spacing:.05em;">Overall Health</td>
              <td style="padding:10px;font-weight:600;color:#1a3a2a;">${analysis?.overallHealth || "—"}</td>
            </tr>
            <tr>
              <td style="padding:10px;background:#f0f9f0;font-size:0.82rem;color:#666;text-transform:uppercase;letter-spacing:.05em;">Severity</td>
              <td style="padding:10px;background:#f0f9f0;font-weight:600;color:#1a3a2a;">${analysis?.severity || "—"}</td>
            </tr>
          </table>

          <h3 style="color:#1a3a2a;margin:0 0 8px;font-size:1rem;">🔍 Conditions Detected</h3>
          <ul style="margin:0 0 20px;padding-left:18px;line-height:1.8;color:#555;">${conditionsList}</ul>

          <h3 style="color:#1a3a2a;margin:0 0 8px;font-size:1rem;">💚 Recommendations</h3>
          <ul style="margin:0 0 24px;padding-left:18px;line-height:1.8;color:#555;">${recommendationsList}</ul>

          <p style="font-size:0.82rem;color:#888;border-top:1px solid #ddd6c7;padding-top:16px;margin:0;">
            ${analysis?.analysis || ""}
          </p>
        </div>

        <div style="background:#f0f9f0;padding:16px 32px;border-radius:0 0 12px 12px;text-align:center;">
          <a href="http://localhost:5173/dashboard" style="background:#1a3a2a;color:#f8f2e8;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:0.88rem;font-weight:500;">View Full Dashboard →</a>
          <p style="font-size:0.72rem;color:#aaa;margin:12px 0 0;">DermisAI · For informational purposes only · Not medical advice.</p>
        </div>
      </div>
    `;

    await mailer.sendMail({
      from:    `"DermisAI 🌿" <${process.env.EMAIL_USER}>`,
      to:      user.email,
      subject: `Your skin analysis is ready — ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long" })}`,
      html:    htmlBody,
    });

    console.log(`✉️  Analysis email sent to ${user.email}`);
  } catch (err) {
    // Never crash the main request due to a notification failure
    console.error("sendAnalysisNotification error (non-fatal):", err.message);
  }
};

// ─── REST endpoints ────────────────────────────────────────────────────────────

// GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 }).limit(60);
    const unreadCount = notifications.filter(n => !n.read).length;
    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/notifications
const createNotification = async (req, res) => {
  try {
    const { type = "custom", message, reminderTime } = req.body;
    if (!message) return res.status(400).json({ success: false, message: "message is required" });

    const n = await Notification.create({ userId: req.user._id, type, message, reminderTime: reminderTime || null });
    res.status(201).json({ success: true, notification: n });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/notifications/:id/read
const markRead = async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true, readAt: new Date() },
      { new: true }
    );
    if (!n) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, notification: n });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/notifications/read-all
const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true, readAt: new Date() });
    res.json({ success: true, message: "All marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getNotifications,
  createNotification,
  markRead,
  markAllRead,
  deleteNotification,
  sendAnalysisNotification,  // ← exported for use in dailyController & skinController
};