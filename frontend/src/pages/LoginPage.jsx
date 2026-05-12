import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form.email, form.password);
      navigate("/analyze");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr",
      background: "var(--warm-white)",
    }}>
      {/* Left panel */}
      <div style={{
        background: "linear-gradient(145deg, var(--forest) 0%, var(--forest-mid) 100%)",
        display: "flex", flexDirection: "column", justifyContent: "center",
        alignItems: "center", padding: "60px 80px", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "-100px", right: "-100px",
          width: "400px", height: "400px", borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
        }} />
        <div style={{
          position: "absolute", bottom: "-80px", left: "-60px",
          width: "300px", height: "300px", borderRadius: "50%",
          background: "rgba(201,149,108,0.12)",
        }} />

        <div style={{ position: "relative", textAlign: "center" }}>
          <div style={{ fontSize: "4rem", marginBottom: "32px" }}>🌿</div>
          <h2 style={{
            fontFamily: "var(--font-display)", color: "var(--cream)",
            fontSize: "2.4rem", fontWeight: 400, lineHeight: 1.2, marginBottom: "20px",
          }}>
            Welcome back to<br />
            <span style={{ color: "var(--rose-gold-light)", fontStyle: "italic" }}>your skin journey</span>
          </h2>
          <p style={{ color: "var(--sage-light)", lineHeight: 1.8, fontSize: "0.95rem", maxWidth: "320px" }}>
            Sign in to access your personalised skin analysis and product recommendations.
          </p>

          <div style={{ marginTop: "48px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {["AI-powered skin condition detection", "Personalised product matching", "Detailed dermatological reports"].map((txt) => (
              <div key={txt} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "20px", height: "20px", borderRadius: "50%",
                  background: "rgba(201,149,108,0.3)", display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <span style={{ fontSize: "10px", color: "var(--rose-gold-light)" }}>✓</span>
                </div>
                <span style={{ color: "var(--sage-light)", fontSize: "0.88rem" }}>{txt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        display: "flex", flexDirection: "column", justifyContent: "center",
        alignItems: "center", padding: "60px 80px",
      }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", marginBottom: "48px" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--forest)", fontWeight: 500 }}>
              Dermis<span style={{ color: "var(--rose-gold)", fontStyle: "italic" }}>AI</span>
            </span>
          </Link>

          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: "2.2rem",
            color: "var(--forest)", fontWeight: 400, marginBottom: "8px",
          }}>Sign In</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "36px" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "var(--forest)", fontWeight: 500 }}>Create one free</Link>
          </p>

          {error && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              color: "#b91c1c", borderRadius: "10px", padding: "12px 16px",
              fontSize: "0.88rem", marginBottom: "24px",
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input" type="email" name="email"
                placeholder="you@example.com"
                value={form.email} onChange={handleChange} required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input" type="password" name="password"
                placeholder="••••••••"
                value={form.password} onChange={handleChange} required
              />
            </div>

            <button
              type="submit" className="btn btn-primary"
              disabled={loading}
              style={{ width: "100%", padding: "14px", fontSize: "0.95rem", marginTop: "8px" }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    width: "16px", height: "16px", borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white", animation: "spin 0.8s linear infinite", display: "inline-block",
                  }} />
                  Signing In...
                </span>
              ) : "Sign In →"}
            </button>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default LoginPage;