import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/dashboard",      icon: "🏠", label: "Dashboard" },
  { to: "/daily",          icon: "📸", label: "Daily Analysis" },
  { to: "/analyze",        icon: "🔬", label: "Skin Analysis" },
  { to: "/history",        icon: "📜", label: "History" },
  { to: "/points",         icon: "🏆", label: "Points & Badges" },
  { to: "/coach",          icon: "🤖", label: "AI Coach" },
  { to: "/notifications",  icon: "🔔", label: "Notifications" },
  { to: "/weather",        icon: "🌦️", label: "Weather Tips" },
  { to: "/cart",           icon: "🛒", label: "Shop" },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };

  const width = collapsed ? "72px" : "260px";

  return (
    <aside style={{
      width, minHeight: "100vh", background: "linear-gradient(180deg,#1a2e1a 0%,#2d4a2d 100%)",
      position: "fixed", top: 0, left: 0, zIndex: 100,
      display: "flex", flexDirection: "column",
      transition: "width 0.25s ease", overflow: "hidden",
      boxShadow: "2px 0 20px rgba(0,0,0,0.3)",
    }}>
      {/* Logo / collapse */}
      <div style={{ padding: "20px 16px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <span style={{ fontSize: "1.6rem", flexShrink: 0 }}>🌿</span>
        {!collapsed && <span style={{ color: "#e8d5b7", fontWeight: 700, fontSize: "1.1rem", whiteSpace: "nowrap" }}>DermisAI</span>}
        <button onClick={() => setCollapsed(!collapsed)} style={{
          marginLeft: "auto", background: "none", border: "none", color: "#a8c5a0",
          cursor: "pointer", fontSize: "1rem", flexShrink: 0,
        }}>
          {collapsed ? "▶" : "◀"}
        </button>
      </div>

      {/* User info */}
      {!collapsed && user && (
        <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#4a7c59", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", marginBottom: 8 }}>
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ color: "#e8d5b7", fontSize: "0.85rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
          <div style={{ color: "#a8c5a0", fontSize: "0.72rem" }}>🏆 {user.points || 0} pts</div>
        </div>
      )}

      {/* Nav links */}
      <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
        {navItems.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: "flex", alignItems: "center", gap: "14px",
            padding: collapsed ? "14px 20px" : "12px 20px",
            color: isActive ? "#e8d5b7" : "#a8c5a0",
            background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
            borderLeft: isActive ? "3px solid #b8d4b8" : "3px solid transparent",
            textDecoration: "none", fontSize: "0.88rem",
            transition: "all 0.15s", whiteSpace: "nowrap",
            borderRadius: "0 8px 8px 0", marginRight: "8px",
          })}>
            <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{icon}</span>
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <button onClick={handleLogout} style={{
          width: "100%", padding: "10px", background: "rgba(255,80,80,0.15)",
          border: "1px solid rgba(255,80,80,0.3)", borderRadius: "8px",
          color: "#ff8080", cursor: "pointer", display: "flex", alignItems: "center",
          gap: "10px", fontSize: "0.85rem", justifyContent: collapsed ? "center" : "flex-start",
        }}>
          <span>🚪</span>
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;