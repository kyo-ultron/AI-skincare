import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/*
  HomePage — shown to both logged-in and logged-out users.

  For LOGGED-OUT: Hero → features → how-it-works → CTA to register
  For LOGGED-IN : Same hero but CTAs change to /analyze, /dashboard, etc.
                  PLUS a "Quick Access" panel with cards for every feature.
*/

// ─── Sub-components ────────────────────────────────────────────────────────────

const FeatureCard = ({ icon, title, desc }) => (
  <div className="card" style={{
    padding: "32px 28px", textAlign: "center",
    transition: "transform 0.25s, box-shadow 0.25s",
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
  >
    <div style={{
      fontSize: "2.2rem", width: "60px", height: "60px", borderRadius: "50%",
      background: "var(--cream)", display: "flex", alignItems: "center",
      justifyContent: "center", margin: "0 auto 18px",
    }}>{icon}</div>
    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--forest)", marginBottom: "10px" }}>{title}</h3>
    <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.7 }}>{desc}</p>
  </div>
);

const StepItem = ({ num, title, desc }) => (
  <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
    <div style={{
      minWidth: "42px", height: "42px", borderRadius: "50%",
      background: "var(--forest)", color: "var(--cream)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600,
    }}>{num}</div>
    <div>
      <h4 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color: "var(--forest)", marginBottom: "6px" }}>{title}</h4>
      <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.7 }}>{desc}</p>
    </div>
  </div>
);

/*
  Quick-access card for logged-in dashboard section
  Clicking the whole card navigates to the route.
*/
const QuickCard = ({ to, icon, title, desc, highlight }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(to)}
      style={{
        background: highlight ? "linear-gradient(135deg, var(--forest), #2d6a4f)" : "white",
        border: highlight ? "none" : "1px solid var(--border)",
        borderRadius: "16px", padding: "24px 20px",
        cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s",
        display: "flex", flexDirection: "column", gap: "10px",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      <span style={{ fontSize: "1.8rem" }}>{icon}</span>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", color: highlight ? "var(--cream)" : "var(--forest)", fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: "0.8rem", color: highlight ? "rgba(232,213,183,0.8)" : "var(--text-muted)", lineHeight: 1.6 }}>{desc}</div>
      <div style={{ fontSize: "0.78rem", color: highlight ? "var(--cream)" : "var(--forest)", fontWeight: 500, marginTop: "4px" }}>
        Open →
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const HomePage = () => {
  const { user } = useAuth();

  return (
    <div className="page-wrapper">

      {/* ── Hero ── */}
      <section style={{
        minHeight: "88vh", display: "flex", alignItems: "center",
        background: "linear-gradient(145deg, var(--warm-white) 0%, var(--cream) 50%, #e8f0eb 100%)",
        padding: "80px 40px 60px", position: "relative", overflow: "hidden",
      }}>
        {/* Decorative blobs */}
        <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(138,171,150,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-60px", left: "-60px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(201,149,108,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: "1100px", margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
          {/* Left text */}
          <div>
            <div className="fade-up" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(26,58,42,0.08)", borderRadius: "100px", padding: "6px 16px", marginBottom: "28px" }}>
              <span style={{ fontSize: "12px" }}>✨</span>
              <span style={{ fontSize: "0.76rem", fontWeight: 500, color: "var(--forest)", letterSpacing: "0.06em", textTransform: "uppercase" }}>AI-Powered Skin Analysis</span>
            </div>

            <h1 className="fade-up fade-up-delay-1" style={{
              fontFamily: "var(--font-display)", fontSize: "clamp(2.6rem, 5vw, 4rem)",
              fontWeight: 400, lineHeight: 1.15, color: "var(--forest)", marginBottom: "24px",
            }}>
              Your skin deserves<br />
              <span style={{ color: "var(--rose-gold)", fontStyle: "italic" }}>personalised</span><br />
              expert care.
            </h1>

            <p className="fade-up fade-up-delay-2" style={{ fontSize: "1rem", color: "var(--text-muted)", lineHeight: 1.8, marginBottom: "36px", maxWidth: "440px" }}>
              Upload a photo of your skin and receive a detailed AI analysis — including conditions, severity, and curated product recommendations made just for you.
            </p>

            <div className="fade-up fade-up-delay-3" style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              {user ? (
                <>
                  <Link to="/analyze" className="btn btn-primary" style={{ fontSize: "0.95rem", padding: "14px 30px" }}>
                    Analyse My Skin →
                  </Link>
                  <Link to="/dashboard" className="btn btn-outline" style={{ fontSize: "0.95rem", padding: "14px 30px" }}>
                    My Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary" style={{ fontSize: "0.95rem", padding: "14px 30px" }}>
                    Start for Free →
                  </Link>
                  <Link to="/login" className="btn btn-outline" style={{ fontSize: "0.95rem", padding: "14px 30px" }}>
                    Sign In
                  </Link>
                </>
              )}
            </div>

            <div className="fade-up fade-up-delay-4" style={{ marginTop: "44px", display: "flex", gap: "28px" }}>
              {[["98%", "Accuracy Rate"], ["15+", "Conditions"], ["200+", "Products"]].map(([val, label]) => (
                <div key={label}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", color: "var(--forest)", fontWeight: 500 }}>{val}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right visual */}
          <div className="fade-up fade-up-delay-2" style={{ display: "flex", justifyContent: "center" }}>
            <div style={{
              width: "360px", height: "440px", borderRadius: "32px",
              background: "linear-gradient(135deg, var(--forest) 0%, #2d6a4f 100%)",
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: "20px", padding: "40px",
              boxShadow: "var(--shadow-lg)", position: "relative",
            }}>
              <div style={{ fontSize: "4.5rem" }}>🌿</div>
              <h3 style={{ fontFamily: "var(--font-display)", color: "var(--cream)", fontSize: "1.5rem", textAlign: "center" }}>Scan. Detect. Glow.</h3>
              <p style={{ color: "var(--sage-light)", textAlign: "center", fontSize: "0.85rem", lineHeight: 1.7 }}>Advanced dermatological AI analyses your unique skin profile in seconds.</p>
              {[
                { pos: { top: "24px", right: "-20px" }, label: "Acne Detected", icon: "🔍" },
                { pos: { bottom: "60px", left: "-24px" }, label: "Hydration Low", icon: "💧" },
              ].map(({ pos, label, icon }) => (
                <div key={label} style={{
                  position: "absolute", ...pos,
                  background: "white", borderRadius: "12px", padding: "10px 16px",
                  display: "flex", alignItems: "center", gap: "8px",
                  boxShadow: "var(--shadow-md)", fontSize: "0.8rem", fontWeight: 500,
                  color: "var(--forest)", whiteSpace: "nowrap",
                }}>
                  <span>{icon}</span> {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick Access Panel (only for logged-in users) ── */}
      {user && (
        <section style={{ padding: "80px 40px", background: "#f7faf8" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div style={{ marginBottom: "40px" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: "var(--forest)", fontWeight: 400, marginBottom: "10px" }}>
                Welcome back, <span style={{ fontStyle: "italic", color: "var(--rose-gold)" }}>{user.name?.split(" ")[0]}</span> 👋
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Jump to any feature below</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
              <QuickCard highlight to="/analyze"       icon="🔬" title="Skin Analysis"    desc="Upload a photo and get a full AI analysis of your skin" />
              <QuickCard to="/daily"         icon="📸" title="Daily Analysis"   desc="Track your skin health day by day with progress charts" />
              <QuickCard to="/dashboard"     icon="📊" title="Dashboard"        desc="View your skin progress, scores and trend over time" />
              <QuickCard to="/coach"         icon="🤖" title="AI Coach"         desc="Ask our AI coach anything about your skin conditions" />
              <QuickCard to="/notifications" icon="🔔" title="Notifications"    desc="Set and manage skincare reminders and alerts" />
              <QuickCard to="/history"       icon="📜" title="History"          desc="Browse all your past analyses and recommendations" />
              <QuickCard to="/rewards"       icon="🏆" title="Rewards & Points" desc="Earn points for daily analyses, streaks, and purchases" />
              <QuickCard to="/weather"       icon="🌦️" title="Weather Tips"     desc="Get skincare advice based on your local weather conditions" />
              <QuickCard to="/aging" icon="🕰️" title="Aging Trajectory" desc="AI predicts your skin aging stage and gives personalised anti-aging interventions" />
            </div>
          </div>
        </section>
      )}

      {/* ── Features Section ── */}
      <section style={{ padding: "100px 40px", background: "white" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--forest)", fontWeight: 400, marginBottom: "14px" }}>
              Intelligent skincare, <span style={{ fontStyle: "italic", color: "var(--rose-gold)" }}>personalised</span>
            </h2>
            <p style={{ color: "var(--text-muted)", maxWidth: "500px", margin: "0 auto", lineHeight: 1.8 }}>
              Powered by advanced AI to understand your skin better than ever before.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
            <FeatureCard icon="🔬" title="Clinical Analysis"   desc="Advanced AI analyses 15+ skin conditions including acne, hyperpigmentation, dehydration, and early signs of aging." />
            <FeatureCard icon="🧴" title="Curated Products"    desc="Receive personalised product recommendations matched specifically to your skin conditions and concerns." />
            <FeatureCard icon="📊" title="Progress Tracking"   desc="Track your skin health daily with scores, charts, and AI-generated insights about your improvement." />
            <FeatureCard icon="🌦️" title="Weather-Aware Tips"  desc="Get real-time skincare advice that adapts to your local temperature, UV index, humidity and air quality." />
            <FeatureCard icon="🔔" title="Smart Reminders"     desc="Set daily reminders for your skincare routine, and never miss an analysis day again." />
            <FeatureCard icon="🏆" title="Rewards System"      desc="Earn points for every analysis and daily streak. Redeem them for discounts and exclusive rewards." />
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: "100px 40px", background: "var(--cream)" }}>
        <div style={{ maxWidth: "780px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--forest)", fontWeight: 400, marginBottom: "52px", textAlign: "center" }}>
            How it <span style={{ fontStyle: "italic", color: "var(--rose-gold)" }}>works</span>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <StepItem num="1" title="Create your free account" desc="Sign up in seconds. Your data stays private, secure, and belongs only to you." />
            <div style={{ width: "2px", height: "20px", background: "var(--sage-light)", marginLeft: "20px" }} />
            <StepItem num="2" title="Upload a clear skin photo"  desc="Take a close-up in natural light. Our AI works best without filters or heavy makeup." />
            <div style={{ width: "2px", height: "20px", background: "var(--sage-light)", marginLeft: "20px" }} />
            <StepItem num="3" title="Get your personalised report" desc="Our AI detects conditions, scores your skin health, and tells you exactly what to do." />
            <div style={{ width: "2px", height: "20px", background: "var(--sage-light)", marginLeft: "20px" }} />
            <StepItem num="4" title="Track, improve, and shop" desc="Daily tracking shows your progress. The dashboard never lies — watch your skin improve." />
          </div>
          <div style={{ textAlign: "center", marginTop: "52px" }}>
            <Link to={user ? "/analyze" : "/register"} className="btn btn-primary" style={{ fontSize: "1rem", padding: "16px 40px" }}>
              {user ? "Analyse My Skin Now →" : "Get Started Free →"}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: "36px 40px", borderTop: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "var(--warm-white)", flexWrap: "wrap", gap: "12px",
      }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "var(--forest)", fontWeight: 500 }}>
          Dermis<span style={{ color: "var(--rose-gold)", fontStyle: "italic" }}>AI</span>
        </span>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
          © 2025 DermisAI · For educational purposes only · Not a substitute for professional dermatological advice.
        </p>
      </footer>

    </div>
  );
};

export default HomePage;