/**
 * DashboardPage.jsx
 *
 * FIXES:
 * 1. Dashboard called getDashboard() + getDailyProgress() + getPoints().
 *    getDashboard() queries SkinAnalysis with isDaily:true AND ProgressEntry.
 *    But the normal AnalysisPage (before our skinController fix) was saving
 *    entries with isDaily:false — so getDailyProgress() returned nothing,
 *    and the dashboard showed "Your dashboard is waiting".
 *
 *    FIX: hasData now checks BOTH isDaily and non-daily entries:
 *    - getDashboard() returns hasAnyEntries (already checks all SkinAnalysis)
 *    - getDailyProgress() returns hasData (only isDaily:true)
 *    We show the dashboard if EITHER is true.
 *
 * 2. chartData from getDashboard (non-daily entries) was ignored — only
 *    prog?.chartData was used. FIX: coalesce both sources.
 *
 * 3. latestScores were only from prog?.summary?.latestScores.
 *    If no daily analyses but normal analyses exist, latestScores was null
 *    and the scores panel was hidden.
 *    FIX: also derive scores from dash?.latestAnalysis as fallback.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboard, getDailyProgress, getPoints } from "../services/api";

const StatCard = ({ label, value, icon, sub }) => (
  <div className="card" style={{ padding: "22px", textAlign: "center" }}>
    <div style={{ fontSize: "1.8rem", marginBottom: "6px" }}>{icon}</div>
    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.9rem", color: "var(--forest)", fontWeight: 500 }}>{value}</div>
    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
    {sub && <div style={{ fontSize: "0.72rem", color: "var(--rose-gold)", marginTop: "3px" }}>{sub}</div>}
  </div>
);

const ScoreBar = ({ label, value = 0, color }) => (
  <div style={{ marginBottom: "12px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
      <span style={{ fontSize: "0.83rem", color: "var(--charcoal)" }}>{label}</span>
      <span style={{ fontSize: "0.83rem", fontWeight: 600, color: "var(--forest)" }}>{value}/100</span>
    </div>
    <div style={{ height: "7px", background: "var(--cream)", borderRadius: "100px", overflow: "hidden" }}>
      <div style={{ height: "100%", borderRadius: "100px", width: `${value}%`, background: color, transition: "width 1.2s ease" }} />
    </div>
  </div>
);

const InsightBadge = ({ text }) => {
  const map = { "Skin improving": "#27ae60", "Hydration improved": "#2980b9", "Acne reduced": "#8e44ad", "Needs consistency": "#e67e22", Stable: "#7f8c8d" };
  const c   = map[text] || "#7f8c8d";
  return <span style={{ background: `${c}18`, color: c, padding: "3px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600 }}>{text}</span>;
};

const LineChart = ({ data }) => {
  if (!data || data.length < 2) return (
    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: "0.88rem" }}>
      Complete at least 2 analyses to see your trend line
    </div>
  );
  const W = 100, H = 160;
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((Math.min(Math.max(d.overall, 0), 100)) / 100) * H,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 10}`} style={{ width: "100%", overflow: "visible" }} preserveAspectRatio="none">
        <path d={`${pathD} L ${W} ${H} L 0 ${H} Z`} fill="rgba(26,58,42,0.06)" />
        <path d={pathD} fill="none" stroke="var(--forest)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="var(--forest)" stroke="white" strokeWidth="1.5" />)}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
        {data.map((d, i) => <span key={i} style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>D{d.day}</span>)}
      </div>
    </div>
  );
};

// Derive display scores from a Gemini analysis object (fallback when DB scores missing)
const deriveScoresFromAnalysis = (analysis) => {
  if (!analysis) return null;
  const conditions = (analysis.conditions || []).map(c => c.toLowerCase());
  const healthMap  = { Excellent: 92, Good: 78, Fair: 58, Poor: 38 };
  const base       = healthMap[analysis.overallHealth] || 58;
  const has        = (kw) => conditions.some(c => c.includes(kw));
  return {
    overall:   base,
    clarity:   Math.max(15, base - (has("acne") || has("breakout") ? 22 : 0)),
    hydration: Math.max(15, base - (has("dry")  ? 25 : 0) + (has("oily") ? 5 : 0)),
    evenness:  Math.max(15, base - (has("pigment") || has("uneven") ? 20 : 0)),
  };
};

const DashboardPage = () => {
  const { user }    = useAuth();
  const [dash, setDash]   = useState(null);
  const [prog, setProg]   = useState(null);
  const [pts,  setPts]    = useState({ points: 0, streak: 0, badges: [] });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [dashRes, progRes, ptsRes] = await Promise.allSettled([
        getDashboard(),
        getDailyProgress(),
        getPoints(),
      ]);

      if (dashRes.status === "fulfilled") setDash(dashRes.value);
      else { console.error("Dashboard error:", dashRes.reason); setError("Could not load dashboard data."); }

      if (progRes.status === "fulfilled") setProg(progRes.value);
      if (ptsRes.status  === "fulfilled") setPts(ptsRes.value);
    } catch (e) {
      setError("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "50%", border: "3px solid var(--sage-light)", borderTopColor: "var(--forest)", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
        <p style={{ color: "var(--forest)", fontFamily: "var(--font-display)" }}>Loading your dashboard...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  // ✅ FIX: Check BOTH daily-progress AND dashboard sources
  const hasData = dash?.hasAnyEntries || prog?.hasData;

  if (!hasData && !error) return (
    <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "18px", background: "var(--warm-white)", padding: "40px" }}>
      <div style={{ fontSize: "3.5rem" }}>📊</div>
      <h2 style={{ fontFamily: "var(--font-display)", color: "var(--forest)", fontWeight: 400 }}>Your dashboard is waiting</h2>
      <p style={{ color: "var(--text-muted)", textAlign: "center", maxWidth: "400px" }}>
        Complete your first skin analysis to start tracking your skin health. Your scores, trends, and insights will appear here.
      </p>
      <div style={{ display: "flex", gap: "12px" }}>
        <Link to="/analyze" className="btn btn-primary"  style={{ padding: "12px 28px" }}>Start Analysis →</Link>
        <Link to="/daily"   className="btn btn-outline" style={{ padding: "12px 28px" }}>Daily Analysis</Link>
      </div>
    </div>
  );

  const profile   = dash?.profile;
  const firstName = user?.name?.split(" ")[0] || "there";

  // ✅ FIX: coalesce both chart data sources
  const chartData = (prog?.chartData?.length ? prog.chartData : null) || (dash?.chartData?.length ? dash.chartData : []);

  // ✅ FIX: latestScores from daily progress OR derived from normal analysis
  const latest    = prog?.summary?.latestScores
    || (dash?.latestAnalysis ? deriveScoresFromAnalysis(dash.latestAnalysis) : null);

  const latAnal   = dash?.latestAnalysis || prog?.summary?.latestAnalysis;

  return (
    <div style={{ background: "var(--warm-white)", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "44px 32px" }}>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", fontSize: "0.88rem" }}>
            {error}
            <button onClick={load} style={{ marginLeft: "12px", background: "none", border: "none", color: "#1565c0", cursor: "pointer", textDecoration: "underline", fontSize: "0.88rem" }}>Retry</button>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: "36px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <p style={{ fontSize: "0.76rem", color: "var(--rose-gold)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, marginBottom: "6px" }}>
              Welcome back, {firstName}
            </p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.6rem", color: "var(--forest)", fontWeight: 400 }}>
              Skin <span style={{ fontStyle: "italic", color: "var(--rose-gold)" }}>Dashboard</span>
            </h1>
            {profile?.startDate && (
              <p style={{ color: "var(--text-muted)", marginTop: "5px", fontSize: "0.88rem" }}>
                Day {profile.currentDay} · Started {new Date(profile.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Link to="/coach"   className="btn btn-primary" style={{ padding: "9px 22px", fontSize: "0.85rem" }}>Talk to Coach 🌿</Link>
            <Link to="/analyze" className="btn btn-outline" style={{ padding: "9px 22px", fontSize: "0.85rem" }}>+ New Analysis</Link>
          </div>
        </div>

        {prog?.summary?.skippedWarning && (
          <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center" }}>
            <span>⚠️</span>
            <span style={{ color: "#856404", fontSize: "0.88rem" }}>
              No daily analysis in {prog.summary.daysSinceLast} day{prog.summary.daysSinceLast !== 1 ? "s" : ""}. Consistency is key!
            </span>
            <Link to="/daily" style={{ marginLeft: "auto", background: "#ffc107", color: "#000", padding: "5px 14px", borderRadius: "7px", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600 }}>Analyze Now</Link>
          </div>
        )}

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "18px", marginBottom: "28px" }}>
          <StatCard icon="📅" label="Day"      value={profile?.currentDay || 1}                                             sub="of journey" />
          <StatCard icon="🔥" label="Streak"   value={`${pts.streak || profile?.streak || 0}d`}                            sub="consecutive" />
          <StatCard icon="📸" label="Analyses" value={dash?.totalEntries || prog?.summary?.totalEntries || 0}              sub="photos tracked" />
          <StatCard icon="🏆" label="Points"   value={pts.points || 0}                                                     sub="earned" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "22px", alignItems: "start" }}>

          {/* Chart */}
          <div className="card" style={{ padding: "26px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--forest)" }}>Overall Score Over Time</h3>
              {prog?.summary?.improvementPct !== undefined && (
                <span style={{ background: prog.summary.improvementPct >= 0 ? "#e8f5e9" : "#fef2f2", color: prog.summary.improvementPct >= 0 ? "#2e7d32" : "#c62828", padding: "3px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 600 }}>
                  {prog.summary.improvementPct >= 0 ? "+" : ""}{prog.summary.improvementPct}%
                </span>
              )}
            </div>
            <LineChart data={chartData} />
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

            {latest && (
              <div className="card" style={{ padding: "22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", color: "var(--forest)" }}>Latest Scores</h3>
                  {prog?.summary?.topInsight && <InsightBadge text={prog.summary.topInsight} />}
                </div>
                <ScoreBar label="Overall"   value={latest.overall}   color="var(--forest)" />
                <ScoreBar label="Clarity"   value={latest.clarity}   color="#8ab5a0" />
                <ScoreBar label="Hydration" value={latest.hydration} color="#6baed6" />
                <ScoreBar label="Evenness"  value={latest.evenness}  color="var(--rose-gold)" />
              </div>
            )}

            {latAnal?.conditions?.length > 0 && (
              <div className="card" style={{ padding: "22px" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", color: "var(--forest)", marginBottom: "12px" }}>Conditions Tracked</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                  {latAnal.conditions.map(c => (
                    <span key={c} style={{ background: "rgba(26,58,42,0.07)", color: "var(--forest)", borderRadius: "100px", padding: "5px 13px", fontSize: "0.78rem", border: "1px solid rgba(26,58,42,0.12)" }}>{c}</span>
                  ))}
                </div>
              </div>
            )}

            {pts.badges?.length > 0 && (
              <div className="card" style={{ padding: "22px" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", color: "var(--forest)", marginBottom: "12px" }}>🏅 Badges Earned</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                  {pts.badges.map(b => (
                    <span key={b} style={{ background: "#fff8e1", border: "1px solid #ffe082", color: "#e67e22", padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600 }}>
                      {b.replace(/_/g, " ")} ✓
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: "linear-gradient(135deg,var(--forest),#2d6a4f)", borderRadius: "16px", padding: "22px", color: "var(--cream)", textAlign: "center" }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>🌿</div>
              <h4 style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", marginBottom: "7px" }}>Ask your AI Coach</h4>
              <p style={{ fontSize: "0.8rem", opacity: 0.8, marginBottom: "14px", lineHeight: 1.6 }}>Get personalised advice based on your skin data.</p>
              <Link to="/coach" style={{ background: "var(--cream)", color: "var(--forest)", padding: "9px 22px", borderRadius: "100px", textDecoration: "none", fontSize: "0.83rem", fontWeight: 500 }}>Open Coach →</Link>
            </div>

          </div>
        </div>

        {/* Quick links */}
        <div style={{ marginTop: "28px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {[
            { to: "/daily",         label: "📸 Daily Analysis" },
            { to: "/history",       label: "📜 History" },
            { to: "/notifications", label: "🔔 Reminders" },
            { to: "/points",        label: "🏆 Rewards" },
            { to: "/weather",       label: "🌦️ Weather Tips" },
          ].map(({ to, label }) => (
            <Link key={to} to={to} style={{ background: "white", border: "1px solid var(--border)", borderRadius: "10px", padding: "9px 18px", textDecoration: "none", color: "var(--forest)", fontSize: "0.83rem", fontWeight: 500, boxShadow: "var(--shadow-sm)" }}>
              {label}
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;