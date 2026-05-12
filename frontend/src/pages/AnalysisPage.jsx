import { useState, useRef } from "react";
import { analyzeSkin, analyzeWithModel, saveProgressEntry } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";

// ── Sub-components ─────────────────────────────────────────────────────────────

const UploadZone = ({ onImageSelect, preview, analyzing }) => {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return alert("Image must be under 10MB");
    const reader = new FileReader();
    reader.onload = (e) => onImageSelect(e.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div
      onClick={() => !analyzing && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
      style={{
        border: `2px dashed ${dragging ? "var(--forest)" : "var(--border)"}`,
        borderRadius: "20px", background: dragging ? "rgba(26,58,42,0.04)" : "var(--cream)",
        padding: "48px 32px", textAlign: "center",
        cursor: analyzing ? "not-allowed" : "pointer",
        transition: "all 0.25s", minHeight: "300px",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px",
      }}
    >
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
      {preview ? (
        <>
          <img src={preview} alt="preview" style={{ maxHeight: "240px", maxWidth: "100%", borderRadius: "12px", objectFit: "cover", boxShadow: "var(--shadow-md)" }} />
          {!analyzing && <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Click or drag to replace</p>}
        </>
      ) : (
        <>
          <div style={{ width: "68px", height: "68px", borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", boxShadow: "var(--shadow-sm)" }}>📷</div>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color: "var(--forest)", marginBottom: "5px" }}>Upload a skin photo</p>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.7 }}>Drag & drop or click · JPG, PNG, WEBP · Max 10MB</p>
          </div>
        </>
      )}
    </div>
  );
};

const SeverityBadge = ({ severity }) => {
  const map = { Mild: ["#d1fae5","#065f46"], Moderate: ["#fef3c7","#92400e"], Severe: ["#fee2e2","#991b1b"] };
  const [bg, color] = map[severity] || ["#f3f4f6","#374151"];
  return <span style={{ background: bg, color, borderRadius: "100px", padding: "4px 14px", fontSize: "0.78rem", fontWeight: 500 }}>{severity}</span>;
};

const HealthBadge = ({ health }) => {
  const map = { Excellent: "#22c55e", Good: "#84cc16", Fair: "#f59e0b", Poor: "#ef4444" };
  return <span style={{ background: `${map[health]||"#6b7280"}20`, color: map[health]||"#6b7280", borderRadius: "100px", padding: "4px 14px", fontSize: "0.78rem", fontWeight: 500 }}>{health}</span>;
};

const StarRating = ({ rating }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
    {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= Math.round(rating) ? "#f59e0b" : "#d1d5db", fontSize: "11px" }}>★</span>)}
    <span style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginLeft: "4px" }}>{rating}</span>
  </div>
);

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const handleAdd = () => { addToCart(product); setAdded(true); setTimeout(() => setAdded(false), 1500); };
  return (
    <div className="card" style={{ transition: "transform 0.25s,box-shadow 0.25s" }}
      onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="var(--shadow-md)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}>
      <div style={{ height: "150px", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" }}>
        {product.image ? <img src={product.image} alt={product.name} style={{ width:"100%",height:"100%",objectFit:"cover" }} /> : "🧴"}
      </div>
      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 500, color: "var(--rose-gold)", textTransform: "uppercase" }}>{product.brand}</span>
          <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--forest)" }}>{product.price}</span>
        </div>
        <h4 style={{ fontFamily: "var(--font-display)", fontSize: "0.95rem", color: "var(--charcoal)", marginBottom: "5px" }}>{product.name}</h4>
        <StarRating rating={product.rating} />
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.6, marginTop: "7px" }}>{product.description}</p>
        <button onClick={handleAdd} className="btn btn-primary" style={{ width: "100%", marginTop: "12px", padding: "9px", fontSize: "0.82rem", background: added ? "var(--sage)" : undefined }}>
          {added ? "✓ Added!" : "Add to Cart 🛒"}
        </button>
      </div>
    </div>
  );
};

const ModelResults = ({ modelResult }) => (
  <div className="card" style={{ padding: "30px", marginBottom: "28px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px", flexWrap: "wrap", gap: "10px" }}>
      <div>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--forest)", marginBottom: "3px" }}>🧠 Skin Condition Detection</h3>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{modelResult.modelInfo || "EfficientNet-B3 · Trained on DermNet"}</p>
      </div>
      {modelResult.severity && <SeverityBadge severity={modelResult.severity} />}
    </div>
    <div style={{ background: "linear-gradient(135deg,var(--forest),#2d6a4f)", borderRadius: "14px", padding: "26px", marginBottom: "22px", textAlign: "center", color: "white" }}>
      <p style={{ fontSize: "0.72rem", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Primary Detection</p>
      <p style={{ fontFamily: "var(--font-display)", fontSize: "1.9rem", marginBottom: "10px" }}>{modelResult.topCondition}</p>
      <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: "rgba(255,255,255,0.15)", borderRadius: "100px", padding: "5px 16px" }}>
        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: modelResult.confidence > 75 ? "#4ade80" : modelResult.confidence > 50 ? "#facc15" : "#f87171" }} />
        <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{modelResult.confidence}% confidence</span>
      </div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {modelResult.allConditions?.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "0.73rem", color: "var(--text-muted)", minWidth: "14px", fontWeight: i===0?700:400 }}>{i+1}</span>
          <span style={{ fontSize: "0.85rem", color: "var(--charcoal)", flex: 1, fontWeight: i===0?600:400 }}>{item.condition}</span>
          <div style={{ flex: 2, background: "#f3f4f6", borderRadius: "100px", height: "7px", overflow: "hidden" }}>
            <div style={{ width: `${item.confidence}%`, height: "100%", background: i===0?"var(--forest)":"var(--sage)", borderRadius: "100px", transition: "width 1s ease" }} />
          </div>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", minWidth: "44px", textAlign: "right" }}>{item.confidence}%</span>
        </div>
      ))}
    </div>
  </div>
);

const AnalysisResults = ({ analysis, products, saved }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
    {saved && (
      <div style={{ background: "#f0fdf4", border: "1px solid #c8e6c9", borderRadius: "10px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
        <span>✅</span>
        <span style={{ color: "#2e7d32", fontSize: "0.88rem", fontWeight: 500 }}>Analysis saved to your dashboard! <Link to="/dashboard" style={{ color: "#1565c0" }}>View Dashboard →</Link></span>
      </div>
    )}
    <div className="card" style={{ padding: "30px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--forest)", marginBottom: "3px" }}>✨ Full AI Skin Analysis</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Gemini AI · For informational purposes only</p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {analysis.severity    && <SeverityBadge severity={analysis.severity} />}
          {analysis.overallHealth && <HealthBadge health={analysis.overallHealth} />}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "22px", alignItems: "start" }}>
        <div style={{ background: "var(--cream)", borderRadius: "14px", padding: "18px 22px", textAlign: "center" }}>
          <div style={{ fontSize: "1.8rem", marginBottom: "6px" }}>
            {analysis.skinType==="Oily"?"💧":analysis.skinType==="Dry"?"🌵":analysis.skinType==="Sensitive"?"🌸":"✨"}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Skin Type</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", color: "var(--forest)", fontWeight: 500 }}>{analysis.skinType}</div>
        </div>
        <p style={{ color: "var(--charcoal)", lineHeight: 1.8, fontSize: "0.93rem" }}>{analysis.analysis}</p>
      </div>
    </div>

    {analysis.conditions?.length > 0 && (
      <div className="card" style={{ padding: "26px" }}>
        <h4 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "var(--forest)", marginBottom: "14px" }}>Conditions Detected</h4>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "9px" }}>
          {analysis.conditions.map(c => (
            <span key={c} style={{ background: "rgba(26,58,42,0.07)", color: "var(--forest)", borderRadius: "100px", padding: "7px 16px", fontSize: "0.83rem", border: "1px solid rgba(26,58,42,0.15)" }}>{c}</span>
          ))}
        </div>
      </div>
    )}

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
      {analysis.recommendations?.length > 0 && (
        <div className="card" style={{ padding: "26px" }}>
          <h4 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "var(--forest)", marginBottom: "14px" }}>💚 Skincare Tips</h4>
          {analysis.recommendations.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "10px" }}>
              <div style={{ minWidth: "22px", height: "22px", borderRadius: "50%", background: "var(--sage-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", color: "var(--forest)", fontWeight: 600 }}>{i+1}</div>
              <p style={{ fontSize: "0.85rem", color: "var(--charcoal)", lineHeight: 1.6 }}>{r}</p>
            </div>
          ))}
        </div>
      )}
      {analysis.avoidIngredients?.length > 0 && (
        <div className="card" style={{ padding: "26px" }}>
          <h4 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "var(--forest)", marginBottom: "14px" }}>⚠️ Avoid</h4>
          {analysis.avoidIngredients.map(ing => (
            <div key={ing} style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ color: "#ef4444", fontSize: "10px" }}>✕</span>
              <span style={{ fontSize: "0.85rem", color: "var(--charcoal)" }}>{ing}</span>
            </div>
          ))}
        </div>
      )}
    </div>

    {products?.length > 0 && (
      <div>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", color: "var(--forest)", fontWeight: 400, marginBottom: "6px" }}>Recommended Products</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>Curated for your detected conditions</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "18px" }}>
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    )}
  </div>
);

const Spinner = () => (
  <span style={{ width: "17px", height: "17px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.8s linear infinite", display: "inline-block", flexShrink: 0 }} />
);

// ── Main Page ──────────────────────────────────────────────────────────────────
const AnalysisPage = () => {
  const { user }      = useAuth();
  const [preview, setPreview]         = useState(null);
  const [imageData, setImageData]     = useState(null);
  const [analyzing, setAnalyzing]     = useState(false);
  const [result, setResult]           = useState(null);
  const [saved, setSaved]             = useState(false);
  const [modelAnalyzing, setModelAnalyzing] = useState(false);
  const [modelResult, setModelResult] = useState(null);
  const [error, setError]             = useState("");
  const resultsRef = useRef();

  const handleImageSelect = (dataUrl) => {
    setPreview(dataUrl); setImageData(dataUrl);
    setResult(null); setModelResult(null); setError(""); setSaved(false);
  };

  const handleModelAnalyze = async () => {
    if (!imageData) return;
    setModelAnalyzing(true); setModelResult(null); setError("");
    try {
      const data = await analyzeWithModel(imageData);
      setModelResult(data);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch {
      setError("Model analysis failed. Make sure the Python service is running on port 5001.");
    } finally { setModelAnalyzing(false); }
  };

  const handleAnalyze = async () => {
    if (!imageData) return;
    setAnalyzing(true); setResult(null); setError(""); setSaved(false);
    try {
      const data = await analyzeSkin(imageData);
      setResult(data);

      // ── AUTO-SAVE to MongoDB after successful Gemini analysis ──
      try {
        await saveProgressEntry(imageData, data.analysis);
        setSaved(true);
      } catch (saveErr) {
        console.warn("Could not save to progress (non-fatal):", saveErr.message);
      }

      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      setError(err.response?.data?.message || "Analysis failed. Please try with a clearer photo.");
    } finally { setAnalyzing(false); }
  };

  const handleReset = () => {
    setPreview(null); setImageData(null); setResult(null);
    setModelResult(null); setError(""); setSaved(false);
  };

  const isBusy = analyzing || modelAnalyzing;

  return (
    <div style={{ background: "var(--warm-white)", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "44px 32px" }}>

        <div style={{ marginBottom: "42px" }}>
          <p style={{ fontSize: "0.76rem", color: "var(--rose-gold)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, marginBottom: "7px" }}>
            Welcome back, {user?.name?.split(" ")[0]}
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem,4vw,3rem)", color: "var(--forest)", fontWeight: 400 }}>
            Skin <span style={{ fontStyle: "italic", color: "var(--rose-gold)" }}>Analysis</span>
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "8px", fontSize: "0.93rem" }}>
            Upload a clear skin photo · results are automatically saved to your dashboard.
          </p>
        </div>

        <div style={{ maxWidth: "600px", marginBottom: "44px" }}>
          <UploadZone onImageSelect={handleImageSelect} preview={preview} analyzing={isBusy} />

          {error && (
            <div style={{ marginTop: "14px", background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: "10px", padding: "11px 14px", fontSize: "0.85rem" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "18px", flexWrap: "wrap" }}>
            <button onClick={handleModelAnalyze} disabled={!imageData||isBusy} className="btn btn-primary"
              style={{ flex: 1, padding: "13px", fontSize: "0.92rem", background: "var(--forest)", minWidth: "170px" }}>
              {modelAnalyzing ? <span style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:"9px" }}><Spinner /> Running model...</span> : "🧠 Detect Conditions"}
            </button>
            <button onClick={handleAnalyze} disabled={!imageData||isBusy} className="btn btn-primary"
              style={{ flex: 1, padding: "13px", fontSize: "0.92rem", background: "var(--rose-gold)", minWidth: "170px" }}>
              {analyzing ? <span style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:"9px" }}><Spinner /> Analysing...</span> : "✨ Full AI Analysis"}
            </button>
            {preview && !isBusy && <button onClick={handleReset} className="btn btn-outline" style={{ padding: "13px 18px" }}>Clear</button>}
          </div>

          {isBusy && (
            <div style={{ marginTop: "18px", background: "var(--cream)", borderRadius: "11px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ fontSize: "1.3rem" }}>{modelAnalyzing ? "🧠" : "✨"}</div>
              <div>
                <p style={{ fontSize: "0.88rem", color: "var(--forest)", fontWeight: 500 }}>
                  {modelAnalyzing ? "Detecting skin conditions..." : "Analysing with Gemini AI..."}
                </p>
                <p style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>This usually takes 5–15 seconds</p>
              </div>
            </div>
          )}
        </div>

        {!result && !modelResult && !isBusy && (
          <div style={{ background: "linear-gradient(135deg,var(--forest),#2d6a4f)", borderRadius: "18px", padding: "28px 36px", color: "var(--cream)", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "22px", maxWidth: "760px" }}>
            {[["☀️","Natural Light","Use natural daylight, avoid flash"],["📏","Close-Up","Hold phone 30-40cm from face"],["🚫","No Filters","Original photo gives best results"]].map(([icon,title,desc]) => (
              <div key={title} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.7rem", marginBottom: "7px" }}>{icon}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "0.95rem", marginBottom: "3px" }}>{title}</div>
                <div style={{ fontSize: "0.76rem", opacity: 0.75 }}>{desc}</div>
              </div>
            ))}
          </div>
        )}

        <div ref={resultsRef}>
          {modelResult && (
            <>
              <ModelResults modelResult={modelResult} />
              <div style={{ textAlign: "center", marginBottom: "28px" }}>
                <button onClick={handleReset} className="btn btn-outline" style={{ padding: "11px 30px" }}>Analyse Another Photo</button>
              </div>
            </>
          )}
          {result && (
            <>
              <AnalysisResults analysis={result.analysis} products={result.products} saved={saved} />
              <div style={{ marginTop: "28px", textAlign: "center" }}>
                <button onClick={handleReset} className="btn btn-outline" style={{ padding: "11px 30px" }}>Analyse Another Photo</button>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AnalysisPage;