import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8000/api";
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const TYPE_OPTIONS = [
  { value: "daily_analysis",   label: "📸 Daily Analysis Reminder" },
  { value: "skincare_routine", label: "🌿 Skincare Routine" },
  { value: "streak",           label: "🔥 Streak Reminder" },
  { value: "product_restock",  label: "🛒 Product Restock" },
  { value: "custom",           label: "✏️ Custom Reminder" },
];

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(true);
  const [form, setForm]   = useState({ type: "daily_analysis", message: "", reminderTime: "08:00" });
  const [success, setSuccess] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/notifications`, { headers: headers() });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.message) return;
    try {
      await axios.post(`${API}/notifications`, form, { headers: headers() });
      setSuccess("Reminder created!");
      setForm({ type: "daily_analysis", message: "", reminderTime: "08:00" });
      await load();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    await axios.put(`${API}/notifications/read-all`, {}, { headers: headers() });
    await load();
  };

  const markRead = async (id) => {
    await axios.put(`${API}/notifications/${id}/read`, {}, { headers: headers() });
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const deleteNotif = async (id) => {
    await axios.delete(`${API}/notifications/${id}`, { headers: headers() });
    setNotifications(prev => prev.filter(n => n._id !== id));
  };

  const requestBrowserPermission = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then(p => {
        if (p === "granted") setSuccess("Browser notifications enabled!");
      });
    }
  };

  const typeColor = { daily_analysis: "#4a7c59", skincare_routine: "#2980b9", streak: "#e67e22", product_restock: "#8e44ad", weather: "#16a085", custom: "#7f8c8d" };

  return (
    <div style={{ background: "#f4f7f4", minHeight: "100vh", padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1a2e1a", margin: 0 }}>
          🔔 Notifications {unreadCount > 0 && <span style={{ background: "#e74c3c", color: "white", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "20px", marginLeft: "8px" }}>{unreadCount} new</span>}
        </h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={requestBrowserPermission} style={{ padding: "8px 16px", background: "white", border: "1px solid #ddd", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem" }}>
            Enable Browser Alerts
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ padding: "8px 16px", background: "#4a7c59", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem" }}>
              Mark All Read
            </button>
          )}
        </div>
      </div>
      <p style={{ color: "#666", marginBottom: "24px", fontSize: "0.88rem" }}>Set reminders and manage your skincare notifications.</p>

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "24px" }}>
        {/* Create reminder */}
        <div style={{ background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", alignSelf: "start" }}>
          <h3 style={{ margin: "0 0 16px", color: "#2d4a2d" }}>➕ Set a Reminder</h3>

          <label style={{ display: "block", fontSize: "0.8rem", color: "#555", marginBottom: "4px" }}>Type</label>
          <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "8px", marginBottom: "14px", fontSize: "0.85rem" }}>
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <label style={{ display: "block", fontSize: "0.8rem", color: "#555", marginBottom: "4px" }}>Reminder Time</label>
          <input type="time" value={form.reminderTime} onChange={e => setForm(p => ({ ...p, reminderTime: e.target.value }))}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "8px", marginBottom: "14px", fontSize: "0.85rem", boxSizing: "border-box" }} />

          <label style={{ display: "block", fontSize: "0.8rem", color: "#555", marginBottom: "4px" }}>Message</label>
          <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
            placeholder="e.g., Time to do your daily skin analysis!"
            rows={3} style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "0.85rem", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />

          {success && <div style={{ background: "#f0fdf4", color: "#27ae60", padding: "8px 12px", borderRadius: "8px", marginTop: "10px", fontSize: "0.82rem" }}>{success}</div>}

          <button onClick={handleCreate} style={{
            width: "100%", marginTop: "14px", padding: "12px",
            background: "linear-gradient(135deg,#2d4a2d,#4a7c59)",
            color: "white", border: "none", borderRadius: "10px",
            cursor: "pointer", fontWeight: 600, fontSize: "0.9rem",
          }}>
            💾 Save Reminder
          </button>

          {/* Quick presets */}
          <div style={{ marginTop: "16px" }}>
            <p style={{ fontSize: "0.75rem", color: "#888", marginBottom: "8px" }}>Quick presets:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                { type: "daily_analysis", message: "Time for your daily skin analysis! 📸", time: "08:00" },
                { type: "skincare_routine", message: "Apply your morning skincare routine 🌿", time: "07:30" },
                { type: "streak", message: "Keep your streak alive! Don't miss today's analysis 🔥", time: "20:00" },
              ].map((preset, i) => (
                <button key={i} onClick={() => setForm(preset)} style={{
                  padding: "6px 12px", background: "#f5f5f5", border: "1px solid #eee",
                  borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", color: "#555", textAlign: "left",
                }}>
                  {preset.message}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications list */}
        <div style={{ background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 16px", color: "#2d4a2d" }}>📬 All Notifications</h3>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#4a7c59" }}>Loading...</div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: "#bbb" }}>
              <div style={{ fontSize: "2.5rem" }}>🔕</div>
              <p>No notifications yet. Set a reminder above!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {notifications.map(n => (
                <div key={n._id} style={{
                  padding: "14px 16px", borderRadius: "10px",
                  background: n.read ? "#fafafa" : "#f0fdf4",
                  border: `1px solid ${n.read ? "#eee" : "#c8e6c9"}`,
                  display: "flex", gap: "12px", alignItems: "flex-start",
                }}>
                  <div style={{
                    width: "8px", height: "8px", borderRadius: "50%", marginTop: "6px", flexShrink: 0,
                    background: n.read ? "#ccc" : typeColor[n.type] || "#4a7c59",
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "4px", alignItems: "center" }}>
                      <span style={{ background: `${typeColor[n.type] || "#666"}15`, color: typeColor[n.type] || "#666", padding: "2px 8px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 600 }}>
                        {n.type?.replace(/_/g, " ")}
                      </span>
                      {n.reminderTime && <span style={{ fontSize: "0.7rem", color: "#888" }}>⏰ {n.reminderTime}</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#333" }}>{n.message}</p>
                    <div style={{ fontSize: "0.72rem", color: "#aaa", marginTop: "4px" }}>
                      {new Date(n.createdAt).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    {!n.read && (
                      <button onClick={() => markRead(n._id)} style={{ padding: "4px 10px", background: "#4a7c59", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.72rem" }}>
                        Read
                      </button>
                    )}
                    <button onClick={() => deleteNotif(n._id)} style={{ padding: "4px 10px", background: "#fee", color: "#e74c3c", border: "1px solid #fcc", borderRadius: "6px", cursor: "pointer", fontSize: "0.72rem" }}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;