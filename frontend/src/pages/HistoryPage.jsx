import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8000/api";
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const TABS = ["analysis", "payment", "notification", "weather"];

const HistoryPage = () => {
  const [tab, setTab]         = useState("analysis");
  const [data, setData]       = useState({});
  const [loading, setLoading] = useState(false);
  const [month, setMonth]     = useState("");
  const [year, setYear]       = useState("");

  useEffect(() => { fetchHistory(); }, [tab, month, year]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = { type: tab };
      if (month) params.month = month;
      if (year)  params.year  = year;
      const res = await axios.get(`${API}/history`, { headers: headers(), params });
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const rows = data.analyses || data.payments || data.notifications || data.weather || [];

  return (
    <div style={{ background: "#f4f7f4", minHeight: "100vh", padding: "28px 32px" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1a2e1a", marginBottom: "6px" }}>📜 History</h1>
      <p style={{ color: "#666", marginBottom: "24px", fontSize: "0.88rem" }}>All your past records — analyses, payments, notifications, and weather tips.</p>

      {/* Tab + filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "8px 18px", borderRadius: "20px", border: "none", cursor: "pointer",
              background: tab === t ? "#2d4a2d" : "white",
              color: tab === t ? "white" : "#555",
              fontWeight: tab === t ? 600 : 400,
              boxShadow: "0 1px 6px rgba(0,0,0,0.08)", fontSize: "0.82rem",
              textTransform: "capitalize",
            }}>{t}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
          <select value={month} onChange={e => setMonth(e.target.value)} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.82rem" }}>
            <option value="">All Months</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("en-IN", { month: "long" })}
              </option>
            ))}
          </select>
          <select value={year} onChange={e => setYear(e.target.value)} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.82rem" }}>
            <option value="">All Years</option>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#4a7c59" }}>Loading...</div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#bbb" }}>
            <div style={{ fontSize: "2.5rem" }}>📭</div>
            <p>No {tab} records found</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f0f0f0" }}>
                {tab === "analysis" && ["Date", "Skin Type", "Overall Score", "Conditions", "Type"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#888", fontWeight: 600 }}>{h}</th>
                ))}
                {tab === "payment" && ["Date", "Order ID", "Amount", "Items", "Status", "Points Earned"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#888", fontWeight: 600 }}>{h}</th>
                ))}
                {tab === "notification" && ["Date", "Type", "Message", "Read"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#888", fontWeight: 600 }}>{h}</th>
                ))}
                {tab === "weather" && ["Date", "City", "Temp", "Humidity", "UV", "Top Tip"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#888", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row._id || i} style={{ borderBottom: "1px solid #f5f5f5", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                  {tab === "analysis" && (
                    <>
                      <td style={{ padding: "10px 12px" }}>{new Date(row.createdAt).toLocaleDateString("en-IN")}</td>
                      <td style={{ padding: "10px 12px" }}>{row.analysis?.skinType || "—"}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>{row.scores?.overall || "—"}/100</td>
                      <td style={{ padding: "10px 12px" }}>{row.analysis?.conditions?.join(", ") || "None"}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ background: row.isDaily ? "#e8f5e9" : "#e3f2fd", color: row.isDaily ? "#2e7d32" : "#1565c0", padding: "2px 8px", borderRadius: "20px", fontSize: "0.72rem" }}>
                          {row.isDaily ? "Daily" : "On-Demand"}
                        </span>
                      </td>
                    </>
                  )}
                  {tab === "payment" && (
                    <>
                      <td style={{ padding: "10px 12px" }}>{new Date(row.createdAt).toLocaleDateString("en-IN")}</td>
                      <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: "0.75rem" }}>{row.razorpayOrderId?.slice(-8) || "—"}</td>
                      <td style={{ padding: "10px 12px" }}>₹{((row.amount || 0) / 100).toFixed(2)}</td>
                      <td style={{ padding: "10px 12px" }}>{row.items?.length || 0} item(s)</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ background: row.status === "paid" ? "#e8f5e9" : row.status === "failed" ? "#ffebee" : "#fff8e1", color: row.status === "paid" ? "#2e7d32" : row.status === "failed" ? "#c62828" : "#f57f17", padding: "2px 8px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 600 }}>
                          {row.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>+{row.pointsEarned || 0} pts</td>
                    </>
                  )}
                  {tab === "notification" && (
                    <>
                      <td style={{ padding: "10px 12px" }}>{new Date(row.createdAt).toLocaleDateString("en-IN")}</td>
                      <td style={{ padding: "10px 12px", textTransform: "capitalize" }}>{row.type?.replace(/_/g, " ")}</td>
                      <td style={{ padding: "10px 12px", maxWidth: "300px" }}>{row.message}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ color: row.read ? "#27ae60" : "#e67e22" }}>{row.read ? "✓ Read" : "● Unread"}</span>
                      </td>
                    </>
                  )}
                  {tab === "weather" && (
                    <>
                      <td style={{ padding: "10px 12px" }}>{new Date(row.createdAt).toLocaleDateString("en-IN")}</td>
                      <td style={{ padding: "10px 12px" }}>{row.city}</td>
                      <td style={{ padding: "10px 12px" }}>{row.weather?.temp}°C</td>
                      <td style={{ padding: "10px 12px" }}>{row.weather?.humidity}%</td>
                      <td style={{ padding: "10px 12px" }}>{row.weather?.uvIndex}</td>
                      <td style={{ padding: "10px 12px", maxWidth: "280px", fontSize: "0.75rem", color: "#555" }}>{row.tips?.[0] || "—"}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;