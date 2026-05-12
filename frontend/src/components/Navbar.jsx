import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const NAV_LINKS = [
  { to: "/",              label: "Home",          exact: true },
  { to: "/analyze",       label: "Skin Analysis"              },
  { to: "/daily",         label: "Daily"                      },
  { to: "/dashboard",     label: "Dashboard"                  },
  { to: "/coach",         label: "AI Coach"                   },
  { to: "/notifications", label: "Notifications"              },
  { to: "/history",       label: "History"                    },
  { to: "/points",       label: "Rewards"                    },
  { to: "/weather",       label: "Weather"                    },
  { to: "/aging",         label: "Aging"                      },
];

const Navbar = () => {
  const { user, logout }  = useAuth();
  const { totalItems }    = useCart();
  const location          = useLocation();
  const navigate          = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const handleLogout = () => { logout(); navigate("/"); };

  const isActive = (to, exact) =>
    exact ? location.pathname === to : location.pathname === to;

  const lStyle = (to, exact) => ({
    textDecoration: "none",
    color: isActive(to, exact) ? "var(--forest)" : "var(--text-muted)",
    fontSize: "0.82rem",
    fontWeight: isActive(to, exact) ? 600 : 400,
    borderBottom: isActive(to, exact) ? "2px solid var(--forest)" : "2px solid transparent",
    paddingBottom: "2px",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  });

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
      backgroundColor: "rgba(253,250,245,0.97)",
      backdropFilter: "blur(14px)",
      borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
      transition: "border-color 0.3s",
      padding: "0 28px", height: "72px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.06)" : "none",
    }}>

      {/* Logo */}
      <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "9px", flexShrink: 0 }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--forest)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "16px" }}>🌿</span>
        </div>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 500, color: "var(--forest)" }}>
          Dermis<span style={{ color: "var(--rose-gold)", fontStyle: "italic" }}>AI</span>
        </span>
      </Link>

      {/* Nav links — only shown when logged in */}
      {user && (
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, justifyContent: "center", overflowX: "auto", padding: "0 16px" }}>
          {NAV_LINKS.map(({ to, label, exact }) => (
            <Link key={to} to={to} style={lStyle(to, exact)}>{label}</Link>
          ))}
        </div>
      )}

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
        {user ? (
          <>
            {/* Cart */}
            <Link to="/cart" style={{ textDecoration: "none", position: "relative", display: "flex" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "var(--cream)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem", cursor: "pointer" }}>🛒</div>
              {totalItems > 0 && (
                <span style={{ position: "absolute", top: "-3px", right: "-3px", background: "var(--rose-gold)", color: "white", borderRadius: "50%", width: "16px", height: "16px", fontSize: "0.6rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{totalItems}</span>
              )}
            </Link>

            {/* Avatar */}
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--sage-light)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--forest)", fontSize: "0.9rem", border: "2px solid var(--forest)", cursor: "default" }} title={user.name}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", maxWidth: "70px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name?.split(" ")[0]}</span>

            <button onClick={handleLogout} className="btn btn-outline" style={{ padding: "6px 14px", fontSize: "0.78rem" }}>Sign Out</button>
          </>
        ) : (
          <>
            <Link to="/login"    style={{ textDecoration: "none", color: "var(--forest)", fontSize: "0.88rem", fontWeight: 500, opacity: 0.8 }}>Sign In</Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: "8px 20px", fontSize: "0.85rem" }}>Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;