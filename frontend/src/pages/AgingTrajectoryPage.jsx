import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ── Reusable sub-components ─────────────────────────────────────────────────

const ResultBar = ({ label, value, color, delay = 0 }) => (
  <div style={{ marginBottom: "16px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
      <span style={{ fontSize: "0.85rem", color: "var(--forest)", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: "0.85rem", color: color, fontWeight: 600 }}>{Math.round(value)}%</span>
    </div>
    <div style={{ height: "8px", background: "var(--cream)", borderRadius: "100px", overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${value}%`, background: color,
        borderRadius: "100px", transition: "width 1s ease",
        transitionDelay: `${delay}ms`,
      }} />
    </div>
  </div>
);

const StageCard = ({ stage, active }) => {
  const colors = {
    Early:    { bg: "#e8f5e9", text: "#2e7d32", border: "#a5d6a7" },
    Moderate: { bg: "#fff8e1", text: "#f57f17", border: "#ffe082" },
    Advanced: { bg: "#fce4ec", text: "#c62828", border: "#f48fb1" },
  };
  const c = colors[stage] || colors.Early;
  return (
    <div style={{
      padding: "14px 20px", borderRadius: "12px",
      background: active ? c.bg : "white",
      border: `2px solid ${active ? c.border : "var(--border)"}`,
      transition: "all 0.3s",
      display: "flex", alignItems: "center", gap: "12px",
    }}>
      <div style={{
        width: "12px", height: "12px", borderRadius: "50%",
        background: active ? c.text : "var(--border)",
        boxShadow: active ? `0 0 0 4px ${c.border}` : "none",
        transition: "all 0.3s",
      }} />
      <span style={{
        fontFamily: "var(--font-display)", fontSize: "1rem",
        color: active ? c.text : "var(--text-muted)",
        fontWeight: active ? 600 : 400,
      }}>{stage}</span>
      {active && <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: c.text, fontWeight: 600 }}>← You are here</span>}
    </div>
  );
};

const RecommendationCard = ({ icon, title, desc, urgent }) => (
  <div style={{
    padding: "20px", borderRadius: "14px",
    background: urgent ? "linear-gradient(135deg, var(--forest), #2d6a4f)" : "white",
    border: urgent ? "none" : "1px solid var(--border)",
    display: "flex", gap: "16px", alignItems: "flex-start",
  }}>
    <span style={{ fontSize: "1.5rem", minWidth: "28px" }}>{icon}</span>
    <div>
      <div style={{
        fontFamily: "var(--font-display)", fontSize: "0.95rem",
        color: urgent ? "var(--cream)" : "var(--forest)",
        fontWeight: 500, marginBottom: "4px",
      }}>{title}</div>
      <div style={{
        fontSize: "0.82rem",
        color: urgent ? "rgba(232,213,183,0.85)" : "var(--text-muted)",
        lineHeight: 1.6,
      }}>{desc}</div>
    </div>
  </div>
);

// ── Main Page ───────────────────────────────────────────────────────────────

const AgingTrajectoryPage = () => {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [image, setImage]       = useState(null);
  const [preview, setPreview]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState(null);
  const [gender, setGender]     = useState("0");
  const [dragOver, setDragOver] = useState(false);

  // ── Recommendations per stage ──
  const RECOMMENDATIONS = {
    Early: [
      { icon: "🧴", title: "Build a prevention routine", desc: "Start with SPF 30+ daily — it prevents 80% of visible aging. Morning: cleanser → vitamin C → SPF.", urgent: true },
      { icon: "💧", title: "Hydration is your base", desc: "Use a hyaluronic acid serum AM and PM. Dehydration accelerates fine line formation.", urgent: false },
      { icon: "🌙", title: "Introduce retinol slowly", desc: "Begin with 0.025% retinol 2x/week. This builds collagen and cell turnover from your 20s onward.", urgent: false },
      { icon: "😴", title: "Sleep on your back", desc: "Sleep creases compound over years. Silk pillowcases reduce friction and moisture loss.", urgent: false },
    ],
    Moderate: [
      { icon: "⚡", title: "Upgrade to active ingredients", desc: "Add retinol 0.05-0.1% nightly. Pair with niacinamide to handle pigmentation and pore appearance.", urgent: true },
      { icon: "🔬", title: "Target pigmentation now", desc: "Azelaic acid or alpha-arbutin for dark spots. Consistent SPF 50 is non-negotiable.", urgent: true },
      { icon: "💆", title: "Consider professional treatments", desc: "Chemical peels or microneedling sessions every 6-8 weeks significantly reverse moderate aging signs.", urgent: false },
      { icon: "🧪", title: "Peptide serums for firmness", desc: "Look for palmitoyl tripeptide-1. Peptides signal your skin to produce more collagen.", urgent: false },
    ],
    Advanced: [
      { icon: "🏥", title: "Consult a dermatologist", desc: "Advanced aging benefits most from professional guidance. Prescription tretinoin is significantly more effective.", urgent: true },
      { icon: "⚗️", title: "Retinoid + AHA combination", desc: "Alternating tretinoin nights with glycolic acid nights accelerates cell renewal rapidly.", urgent: true },
      { icon: "💉", title: "In-office options to explore", desc: "Laser resurfacing, radiofrequency, or hyaluronic acid fillers show significant results for advanced signs.", urgent: false },
      { icon: "🛡️", title: "Aggressive antioxidant defence", desc: "Vitamin C + E + ferulic acid combo (morning) protects against further oxidative damage.", urgent: false },
    ],
  };

  // ── Image handling ──
  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setResult(null); setError(null);
    setImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // ── Submit to backend ──
  const handleAnalyse = async () => {
    if (!image) return;
    setLoading(true); setError(null); setResult(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result;
        try {
          const res = await fetch("http://localhost:5002/aging-trajectory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64, gender: parseInt(gender) }),
          });
          const data = await res.json();
          if (data.success) {
            setResult(data);
          } else {
            setError(data.error || "Analysis failed. Please try again.");
          }
        } catch {
          setError("Cannot connect to aging model service. Make sure the server is running on port 5002.");
        }
        setLoading(false);
      };
      reader.readAsDataURL(image);
    } catch {
      setError("Failed to read image."); setLoading(false);
    }
  };

  const recs = result ? RECOMMENDATIONS[result.agingTrajectory] || RECOMMENDATIONS.Early : [];

  return (
    <div className="page-wrapper">

      {/* ── Hero Banner ── */}
      <section style={{
        background: "linear-gradient(135deg, var(--forest) 0%, #2d6a4f 60%, #1a3a2a 100%)",
        padding: "60px 40px 80px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "100px", padding: "6px 16px", marginBottom: "24px" }}>
            <span>🕰️</span>
            <span style={{ fontSize: "0.76rem", fontWeight: 500, color: "var(--cream)", letterSpacing: "0.06em", textTransform: "uppercase" }}>AI Skin Aging Analysis</span>
          </div>

          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
            color: "var(--cream)", fontWeight: 400, lineHeight: 1.2, marginBottom: "18px",
          }}>
            Your skin aging<br />
            <span style={{ color: "#a8d5b5", fontStyle: "italic" }}>trajectory</span>
          </h1>
          <p style={{ color: "rgba(232,213,183,0.8)", maxWidth: "500px", lineHeight: 1.8, fontSize: "0.95rem" }}>
            Upload a face photo and our AI analyses your current aging stage — Early, Moderate, or Advanced — with personalised interventions to slow or reverse it.
          </p>

          <div style={{ display: "flex", gap: "32px", marginTop: "40px" }}>
            {[["3", "Aging stages"], ["23k+", "Training images"], ["88%", "Train accuracy"]].map(([val, label]) => (
              <div key={label}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", color: "var(--cream)", fontWeight: 500 }}>{val}</div>
                <div style={{ fontSize: "0.72rem", color: "rgba(232,213,183,0.7)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <section style={{ padding: "60px 40px", background: "#f7faf8", minHeight: "60vh" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: result ? "1fr 1fr" : "1fr", gap: "40px", alignItems: "start" }}>

          {/* ── Upload Panel ── */}
          <div>
            <div className="card" style={{ padding: "36px" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "var(--forest)", marginBottom: "8px" }}>Upload your photo</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "28px", lineHeight: 1.6 }}>
                Use a clear, well-lit frontal face photo. Remove glasses if possible. No filters.
              </p>

              {/* Gender selector */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ fontSize: "0.82rem", color: "var(--forest)", fontWeight: 500, display: "block", marginBottom: "10px" }}>Biological sex (helps calibrate results)</label>
                <div style={{ display: "flex", gap: "12px" }}>
                  {[["0", "Male"], ["1", "Female"]].map(([val, label]) => (
                    <button key={val} onClick={() => setGender(val)} style={{
                      padding: "10px 24px", borderRadius: "8px", cursor: "pointer",
                      border: gender === val ? "2px solid var(--forest)" : "1px solid var(--border)",
                      background: gender === val ? "var(--forest)" : "white",
                      color: gender === val ? "var(--cream)" : "var(--text-muted)",
                      fontSize: "0.85rem", fontWeight: 500, transition: "all 0.2s",
                    }}>{label}</button>
                  ))}
                </div>
              </div>

              {/* Drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragOver ? "var(--forest)" : preview ? "#8aab96" : "var(--border)"}`,
                  borderRadius: "16px", padding: "32px",
                  background: dragOver ? "rgba(26,58,42,0.04)" : preview ? "transparent" : "var(--cream)",
                  cursor: "pointer", textAlign: "center", transition: "all 0.2s",
                  position: "relative", overflow: "hidden",
                  minHeight: preview ? "280px" : "160px",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                }}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="preview" style={{ maxWidth: "100%", maxHeight: "260px", borderRadius: "12px", objectFit: "contain" }} />
                    <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "12px" }}>Click to change photo</p>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🤳</div>
                    <p style={{ color: "var(--forest)", fontWeight: 500, marginBottom: "4px" }}>Drop photo here or click to browse</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>JPG, PNG · Max 10MB</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />

              {error && (
                <div style={{ marginTop: "16px", padding: "14px 18px", background: "#fce4ec", borderRadius: "10px", color: "#c62828", fontSize: "0.83rem", lineHeight: 1.5 }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={handleAnalyse}
                disabled={!image || loading}
                style={{
                  marginTop: "24px", width: "100%", padding: "16px",
                  background: !image || loading ? "var(--border)" : "linear-gradient(135deg, var(--forest), #2d6a4f)",
                  color: !image || loading ? "var(--text-muted)" : "var(--cream)",
                  border: "none", borderRadius: "12px", fontSize: "1rem",
                  fontFamily: "var(--font-display)", cursor: !image || loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                }}
              >
                {loading ? (
                  <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span> Analysing aging markers...</>
                ) : (
                  <>🕰️ Analyse Aging Trajectory</>
                )}
              </button>
            </div>

            {/* Stage legend */}
            <div className="card" style={{ padding: "28px", marginTop: "20px" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "var(--forest)", marginBottom: "16px" }}>Aging stages explained</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <StageCard stage="Early"    active={result?.agingTrajectory === "Early"} />
                <StageCard stage="Moderate" active={result?.agingTrajectory === "Moderate"} />
                <StageCard stage="Advanced" active={result?.agingTrajectory === "Advanced"} />
              </div>
            </div>
          </div>

          {/* ── Results Panel ── */}
          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Main result */}
              <div className="card" style={{ padding: "36px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
                  <div>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Aging Trajectory</p>
                    <h2 style={{
                      fontFamily: "var(--font-display)", fontSize: "2.2rem",
                      color: result.agingTrajectory === "Early" ? "#2e7d32" : result.agingTrajectory === "Moderate" ? "#f57f17" : "#c62828",
                      fontWeight: 400,
                    }}>{result.agingTrajectory}</h2>
                  </div>
                  <div style={{
                    width: "72px", height: "72px", borderRadius: "50%",
                    background: result.agingTrajectory === "Early" ? "#e8f5e9" : result.agingTrajectory === "Moderate" ? "#fff8e1" : "#fce4ec",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem",
                  }}>
                    {result.agingTrajectory === "Early" ? "🌱" : result.agingTrajectory === "Moderate" ? "🌿" : "🍂"}
                  </div>
                </div>

                <div style={{ marginBottom: "8px" }}>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "16px" }}>Confidence across all stages</p>
                  <ResultBar label="Early"    value={result.probabilities?.Early    ?? 0} color="#2e7d32" delay={0}   />
                  <ResultBar label="Moderate" value={result.probabilities?.Moderate ?? 0} color="#f57f17" delay={100} />
                  <ResultBar label="Advanced" value={result.probabilities?.Advanced ?? 0} color="#c62828" delay={200} />
                </div>

                <div style={{ padding: "16px", background: "var(--cream)", borderRadius: "10px", marginTop: "16px" }}>
                  <p style={{ fontSize: "0.82rem", color: "var(--forest)", lineHeight: 1.7 }}>
                    <strong>Age group detected:</strong> {result.ageGroup} &nbsp;·&nbsp;
                    <strong>Skin condition:</strong> {result.skinCondition} &nbsp;·&nbsp;
                    <strong>Confidence:</strong> {result.confidence}%
                  </p>
                </div>
              </div>

              {/* Recommendations */}
              <div className="card" style={{ padding: "28px" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", color: "var(--forest)", marginBottom: "18px" }}>
                  Personalised interventions
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {recs.map((r, i) => <RecommendationCard key={i} {...r} />)}
                </div>
              </div>

              {/* CTA */}
              <div className="card" style={{
                padding: "28px",
                background: "linear-gradient(135deg, var(--forest), #2d6a4f)",
                border: "none",
              }}>
                <h3 style={{ fontFamily: "var(--font-display)", color: "var(--cream)", fontSize: "1.1rem", marginBottom: "10px" }}>
                  Want a full skin analysis?
                </h3>
                <p style={{ color: "rgba(232,213,183,0.8)", fontSize: "0.83rem", marginBottom: "18px", lineHeight: 1.6 }}>
                  Combine aging trajectory with our 15-condition skin analysis for a complete dermatological profile.
                </p>
                <button onClick={() => navigate("/analyze")} style={{
                  padding: "12px 24px", background: "var(--cream)", color: "var(--forest)",
                  border: "none", borderRadius: "10px", fontSize: "0.88rem",
                  fontFamily: "var(--font-display)", cursor: "pointer", fontWeight: 500,
                }}>
                  Run Full Analysis →
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Info section (only if no result) ── */}
      {!result && (
        <section style={{ padding: "80px 40px", background: "white" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem,3vw,2.6rem)", color: "var(--forest)", textAlign: "center", fontWeight: 400, marginBottom: "14px" }}>
              How aging <span style={{ fontStyle: "italic", color: "var(--rose-gold)" }}>trajectory</span> works
            </h2>
            <p style={{ color: "var(--text-muted)", textAlign: "center", maxWidth: "500px", margin: "0 auto 52px", lineHeight: 1.8, fontSize: "0.9rem" }}>
              Three AI models work together to analyse your face, skin condition, and fuse the signals into a trajectory prediction.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "24px" }}>
              {[
                { step: "01", icon: "🔬", title: "Age Estimation", desc: "EfficientNetB3 analyses facial structure to estimate age group — Young, Middle, or Senior." },
                { step: "02", icon: "🧴", title: "Skin Condition", desc: "A second model detects your current skin condition level — clear, mild aging, or advanced aging." },
                { step: "03", icon: "🕰️", title: "Trajectory Fusion", desc: "Both signals are fused and mapped to your aging trajectory with personalised intervention advice." },
              ].map(({ step, icon, title, desc }) => (
                <div key={step} className="card" style={{ padding: "32px 28px", textAlign: "center" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>Step {step}</div>
                  <div style={{ fontSize: "2rem", marginBottom: "14px" }}>{icon}</div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color: "var(--forest)", marginBottom: "10px" }}>{title}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.84rem", lineHeight: 1.7 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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

export default AgingTrajectoryPage;