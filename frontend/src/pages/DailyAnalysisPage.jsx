import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API = "http://localhost:8000/api";
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

// ── helpers ────────────────────────────────────────────────────────────────────
const insightColor = {
  "Skin improving":    "#27ae60",
  "Hydration improved":"#2980b9",
  "Acne reduced":      "#8e44ad",
  "Needs consistency": "#e67e22",
  "Stable":            "#7f8c8d",
};

const DailyAnalysisPage = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview]       = useState(null);
  const [analyzing, setAnalyzing]   = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState("");
  const [progress, setProgress]     = useState(null);
  const [history, setHistory]       = useState([]);
  const [tab, setTab]               = useState("analyze"); // analyze | progress | history
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => { loadProgress(); }, []);

  useEffect(() => {
    if (tab === "progress" && progress?.chartData?.length && chartRef.current) {
      renderChart();
    }
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [tab, progress]);

  const loadProgress = async () => {
    try {
      const [progRes, histRes] = await Promise.all([
        axios.get(`${API}/daily/progress`,       { headers: headers() }),
        axios.get(`${API}/daily/history?limit=20`, { headers: headers() }),
      ]);
      setProgress(progRes.data);
      setHistory(histRes.data.entries || []);
    } catch (e) { console.error(e); }
  };

  const renderChart = async () => {
    const { Chart, registerables } = await import("https://cdn.jsdelivr.net/npm/chart.js@4/+esm");
    Chart.register(...registerables);

    if (chartInstance.current) chartInstance.current.destroy();

    const labels = progress.chartData.map(d => `Day ${d.day}`);
    chartInstance.current = new Chart(chartRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Overall",   data: progress.chartData.map(d => d.overall),   borderColor: "#e67e22", backgroundColor: "rgba(230,126,34,0.08)", tension: 0.4, fill: true },
          { label: "Hydration", data: progress.chartData.map(d => d.hydration), borderColor: "#2980b9", backgroundColor: "rgba(41,128,185,0.08)", tension: 0.4, fill: false },
          { label: "Clarity",   data: progress.chartData.map(d => d.clarity),   borderColor: "#27ae60", backgroundColor: "rgba(39,174,96,0.08)", tension: 0.4, fill: false },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "top" } },
        scales: {
          y: { min: 0, max: 100, title: { display: true, text: "Score" } },
          x: { title: { display: true, text: "Day" } },
        },
      },
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
    setResult(null);
    setError("");
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return setError("Please select an image first");
    setAnalyzing(true);
    setError("");

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result;
        const res = await axios.post(`${API}/daily/analyze`, { image: base64 }, { headers: headers() });
        setResult(res.data);
        await loadProgress();
      } catch (e) {
        setError(e.response?.data?.message || "Analysis failed. Try again.");
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(selectedImage);
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: "#f4f7f4", minHeight: "100vh", padding: "28px 32px" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1a2e1a", marginBottom: "6px" }}>📸 Daily Skin Analysis</h1>
      <p style={{ color: "#666", marginBottom: "24px", fontSize: "0.88rem" }}>Track your skin health every day for personalised insights and progress graphs.</p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {["analyze", "progress", "history"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 20px", borderRadius: "20px", border: "none", cursor: "pointer",
            background: tab === t ? "#2d4a2d" : "white",
            color: tab === t ? "white" : "#555",
            fontWeight: tab === t ? 600 : 400,
            boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
            fontSize: "0.85rem", textTransform: "capitalize",
          }}>
            {t === "analyze" ? "📸 Analyze" : t === "progress" ? "📊 Progress" : "📜 History"}
          </button>
        ))}
      </div>

      {/* ── Analyze Tab ── */}
      {tab === "analyze" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Upload panel */}
          <div style={{ background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <h3 style={{ margin: "0 0 16px", color: "#2d4a2d" }}>Upload Today's Photo</h3>

            <label style={{
              display: "block", border: "2px dashed #c8e6c9", borderRadius: "12px",
              padding: "30px", textAlign: "center", cursor: "pointer",
              background: preview ? "#f9fff9" : "#fafafa",
            }}>
              {preview ? (
                <img src={preview} alt="preview" style={{ maxHeight: "200px", borderRadius: "8px", objectFit: "cover" }} />
              ) : (
                <>
                  <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>📷</div>
                  <p style={{ color: "#888", fontSize: "0.85rem", margin: 0 }}>Click to upload skin photo</p>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
            </label>

            {error && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", marginTop: "12px", fontSize: "0.82rem" }}>{error}</div>}

            <button onClick={handleAnalyze} disabled={!selectedImage || analyzing} style={{
              width: "100%", marginTop: "16px", padding: "12px",
              background: (!selectedImage || analyzing) ? "#ccc" : "linear-gradient(135deg,#2d4a2d,#4a7c59)",
              color: "white", border: "none", borderRadius: "10px",
              cursor: (!selectedImage || analyzing) ? "not-allowed" : "pointer",
              fontWeight: 600, fontSize: "0.95rem",
            }}>
              {analyzing ? "🔬 Analyzing..." : "🔬 Analyze My Skin"}
            </button>
          </div>

          {/* Result panel */}
          <div style={{ background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <h3 style={{ margin: "0 0 16px", color: "#2d4a2d" }}>Today's Result</h3>
            {!result && !analyzing && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#bbb" }}>
                <div style={{ fontSize: "3rem" }}>🌿</div>
                <p style={{ fontSize: "0.85rem" }}>Upload a photo to see your analysis</p>
              </div>
            )}
            {analyzing && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: "2.5rem", animation: "spin 1s linear infinite" }}>⚙️</div>
                <p style={{ color: "#4a7c59", marginTop: "12px" }}>AI is analyzing your skin...</p>
              </div>
            )}
            {result && (
              <>
                {/* Insight + points */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
                  <span style={{
                    background: `${insightColor[result.insight] || "#666"}15`,
                    color: insightColor[result.insight] || "#666",
                    padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600,
                  }}>{result.insight}</span>
                  <span style={{ background: "#fff8e1", color: "#e67e22", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600 }}>
                    +{result.pointsEarned} pts
                  </span>
                  <span style={{ background: "#fff3e0", color: "#ff6b35", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem" }}>
                    🔥 {result.streak} day streak
                  </span>
                </div>

                {/* Scores */}
                {result.entry?.scores && Object.entries(result.entry.scores).map(([key, val]) => (
                  <div key={key} style={{ marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px", fontSize: "0.8rem" }}>
                      <span style={{ textTransform: "capitalize", color: "#555" }}>{key}</span>
                      <span style={{ fontWeight: 600 }}>{val}/100</span>
                    </div>
                    <div style={{ height: "5px", background: "#f0f0f0", borderRadius: "100px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${val}%`, background: "#4a7c59", borderRadius: "100px" }} />
                    </div>
                  </div>
                ))}

                {/* Skin type */}
                <div style={{ marginTop: "14px", background: "#f0f9f0", borderRadius: "10px", padding: "12px" }}>
                  <div style={{ fontSize: "0.78rem", color: "#555" }}>
                    <b>Skin Type:</b> {result.entry?.analysis?.skinType || "—"}<br />
                    <b>Conditions:</b> {result.entry?.analysis?.conditions?.join(", ") || "None detected"}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Progress Tab ── */}
      {tab === "progress" && (
        <div style={{ background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 16px", color: "#2d4a2d" }}>📈 Skin Progress Over Time</h3>

          {/* Summary cards */}
          {progress?.summary && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "24px" }}>
              {[
                { label: "Improvement", value: `${progress.summary.improvementPct > 0 ? "+" : ""}${progress.summary.improvementPct}%`, color: "#27ae60" },
                { label: "Top Insight", value: progress.summary.topInsight || "—", color: "#2980b9" },
                { label: "Days to Goal", value: progress.summary.estimatedDaysTo80 ? `~${progress.summary.estimatedDaysTo80}d` : "N/A", color: "#e67e22" },
                { label: "Analyses", value: progress.summary.totalEntries, color: "#8e44ad" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: `${color}10`, borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "1.2rem", fontWeight: 700, color }}>{value}</div>
                  <div style={{ fontSize: "0.7rem", color: "#888", marginTop: "2px" }}>{label}</div>
                </div>
              ))}
            </div>
          )}

          {progress?.summary?.skippedWarning && (
            <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "0.82rem", color: "#856404" }}>
              ⚠️ You skipped {progress.summary.daysSinceLast} day(s). Consistency is key for skin improvement!
            </div>
          )}

          {progress?.chartData?.length > 0 ? (
            <canvas ref={chartRef} />
          ) : (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#bbb" }}>
              <div style={{ fontSize: "3rem" }}>📊</div>
              <p>Complete at least 2 daily analyses to see your progress chart</p>
            </div>
          )}
        </div>
      )}

      {/* ── History Tab ── */}
      {tab === "history" && (
        <div style={{ background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 16px", color: "#2d4a2d" }}>📜 Analysis History</h3>
          {history.length === 0 ? (
            <p style={{ textAlign: "center", color: "#bbb", padding: "40px 0" }}>No daily analyses yet</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f0f0f0" }}>
                  {["Day", "Date", "Overall", "Hydration", "Clarity", "Insight", "Skin Type"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#888", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((e, i) => (
                  <tr key={e._id || i} style={{ borderBottom: "1px solid #f5f5f5", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={{ padding: "10px 12px" }}>#{e.dayNumber}</td>
                    <td style={{ padding: "10px 12px" }}>{new Date(e.analysedAt || e.createdAt).toLocaleDateString("en-IN")}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{e.scores?.overall}/100</td>
                    <td style={{ padding: "10px 12px" }}>{e.scores?.hydration}/100</td>
                    <td style={{ padding: "10px 12px" }}>{e.scores?.clarity}/100</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ background: `${insightColor[e.insight] || "#666"}15`, color: insightColor[e.insight] || "#666", padding: "2px 8px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 600 }}>
                        {e.insight || "Stable"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#555" }}>{e.analysis?.skinType || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyAnalysisPage;