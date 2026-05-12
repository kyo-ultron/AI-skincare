import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RegisterPage = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      return setError("Passwords do not match.");
    }
    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    setLoading(true);
    setError("");
    try {
      await register(form.name, form.email, form.password);
      navigate("/analyze");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const strength = form.password.length === 0 ? 0
    : form.password.length < 6 ? 1
    : form.password.length < 10 ? 2 : 3;

  const strengthColor = ["transparent", "#ef4444", "#f59e0b", "#22c55e"][strength];
  const strengthLabel = ["", "Weak", "Fair", "Strong"][strength];

  return (
    <div style={{
      minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr",
      background: "var(--warm-white)",
    }}>
      {/* Left panel */}
      <div style={{
        background: "linear-gradient(145deg, #2a1a35 0%, var(--forest) 60%, var(--forest-mid) 100%)",
        display: "flex", flexDirection: "column", justifyContent: "center",
        alignItems: "center", padding: "60px 80px", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "-80px", left: "-80px",
          width: "350px", height: "350px", borderRadius: "50%",
          background: "rgba(201,149,108,0.1)",
        }} />

        <div style={{ position: "relative", textAlign: "center" }}>
          <div style={{ fontSize: "4rem", marginBottom: "32px" }}>✨</div>
          <h2 style={{
            fontFamily: "var(--font-display)", color: "var(--cream)",
            fontSize: "2.4rem", fontWeight: 400, lineHeight: 1.2, marginBottom: "20px",
          }}>
            Begin your<br />
            <span style={{ color: "var(--rose-gold-light)", fontStyle: "italic" }}>skin transformation</span>
          </h2>
          <p style={{ color: "var(--sage-light)", lineHeight: 1.8, fontSize: "0.95rem", maxWidth: "320px" }}>
            Join thousands of users who've discovered the secret to healthier, more radiant skin.
          </p>

          <div style={{
            marginTop: "48px", background: "rgba(255,255,255,0.06)",
            borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%",
                background: "var(--sage)", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "1.2rem",
              }}>😊</div>
              <div style={{ textAlign: "left" }}>
                <div style={{ color: "var(--cream)", fontSize: "0.88rem", fontWeight: 500 }}>Priya S.</div>
                <div style={{ color: "var(--sage-light)", fontSize: "0.78rem" }}>Mumbai, India</div>
              </div>
            </div>
            <p style={{ color: "var(--sage-light)", fontSize: "0.85rem", lineHeight: 1.7, textAlign: "left", fontStyle: "italic" }}>
              "DermisAI spotted my combination skin and dehydration instantly. The product recommendations cleared my breakouts in 3 weeks!"
            </p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        display: "flex", flexDirection: "column", justifyContent: "center",
        alignItems: "center", padding: "60px 80px", overflowY: "auto",
      }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", marginBottom: "48px" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--forest)", fontWeight: 500 }}>
              Dermis<span style={{ color: "var(--rose-gold)", fontStyle: "italic" }}>AI</span>
            </span>
          </Link>

          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: "2.2rem",
            color: "var(--forest)", fontWeight: 400, marginBottom: "8px",
          }}>Create Account</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "36px" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--forest)", fontWeight: 500 }}>Sign in</Link>
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
              <label className="form-label">Full Name</label>
              <input className="form-input" type="text" name="name" placeholder="Your name"
                value={form.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" name="email" placeholder="you@example.com"
                value={form.email} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" name="password" placeholder="Min. 6 characters"
                value={form.password} onChange={handleChange} required />
              {form.password.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                  <div style={{ flex: 1, height: "4px", borderRadius: "2px", background: "var(--border)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${(strength / 3) * 100}%`,
                      background: strengthColor, transition: "all 0.3s ease", borderRadius: "2px",
                    }} />
                  </div>
                  <span style={{ fontSize: "0.75rem", color: strengthColor, fontWeight: 500 }}>{strengthLabel}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-input" type="password" name="confirm" placeholder="Repeat password"
                value={form.confirm} onChange={handleChange} required
                style={{ borderColor: form.confirm && form.confirm !== form.password ? "#fca5a5" : "" }}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: "100%", padding: "14px", fontSize: "0.95rem", marginTop: "8px" }}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    width: "16px", height: "16px", borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white", animation: "spin 0.8s linear infinite", display: "inline-block",
                  }} />
                  Creating Account...
                </span>
              ) : "Create Account →"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
            By registering, you agree that DermisAI is for informational purposes only<br />and does not constitute professional medical advice.
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default RegisterPage;