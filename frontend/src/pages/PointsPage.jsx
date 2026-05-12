import { useState, useEffect } from "react";
import { getPoints, redeemPoints } from "../services/api";

const BADGE_META = {
  first_analysis: {
    label: "First Analysis",
    icon: "🔬",
    desc: "Complete your first skin analysis",
  },
  week_warrior: {
    label: "Week Warrior",
    icon: "⚔️",
    desc: "Complete 7 daily analyses",
  },
  monthly_master: {
    label: "Monthly Master",
    icon: "👑",
    desc: "Complete 30 daily analyses",
  },
  streak_7: {
    label: "7-Day Streak",
    icon: "🔥",
    desc: "Maintain a 7-day streak",
  },
  streak_30: {
    label: "30-Day Streak",
    icon: "💎",
    desc: "Maintain a 30-day streak",
  },
};

const HOW_TO_EARN = [
  { icon: "📸", action: "Daily Skin Analysis", pts: "+10 pts" },
  { icon: "🔐", action: "Daily Login", pts: "+5 pts" },
  { icon: "🛒", action: "Purchase Products", pts: "+1 pt per ₹10" },
  { icon: "🔥", action: "Maintain 7-Day Streak", pts: "streak_7 badge" },
  { icon: "👑", action: "Maintain 30-Day Streak", pts: "streak_30 badge" },
];

const PointsPage = () => {
  const [data, setData] = useState({
    points: 0,
    streak: 0,
    badges: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [redeemAmt, setRedeemAmt] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getPoints();

      if (res.success) {
        setData({
          points: res.points || 0,
          streak: res.streak || 0,
          badges: res.badges || [],
        });
      } else {
        setError("Could not load points data.");
      }
    } catch (e) {
      console.error(e);
      setError(
        e.response?.data?.message ||
          "Failed to load rewards data."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    const amt = parseInt(redeemAmt);

    if (!amt || amt <= 0) {
      setMsg("Enter a valid amount");
      setMsgType("error");
      return;
    }

    if (amt > data.points) {
      setMsg("Insufficient points");
      setMsgType("error");
      return;
    }

    try {
      const res = await redeemPoints(amt);

      setMsg(res.message || "Points redeemed!");
      setMsgType("success");

      setData((prev) => ({
        ...prev,
        points: res.remainingPoints,
      }));

      setRedeemAmt("");
    } catch (e) {
      setMsg(
        e.response?.data?.message || "Redemption failed"
      );
      setMsgType("error");
    }

    setTimeout(() => setMsg(""), 4000);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              border: "3px solid #c8e6c9",
              borderTopColor: "#1a3a2a",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 14px",
            }}
          />

          <p style={{ color: "#1a3a2a" }}>
            Loading your rewards...
          </p>

          <style>
            {`@keyframes spin { to { transform: rotate(360deg); } }`}
          </style>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#f4f7f4",
        minHeight: "100vh",
        padding: "36px 32px",
      }}
    >
      <h1
        style={{
          fontSize: "1.6rem",
          fontWeight: 700,
          color: "#1a2e1a",
          marginBottom: "6px",
        }}
      >
        🏆 Points & Rewards
      </h1>

      <p
        style={{
          color: "#666",
          marginBottom: "28px",
          fontSize: "0.88rem",
        }}
      >
        Earn points for every activity. Collect badges.
        Redeem rewards.
      </p>

      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "20px",
            fontSize: "0.88rem",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "20px",
          marginBottom: "28px",
        }}
      >
        <div
          style={{
            background:
              "linear-gradient(135deg,#e67e22,#f39c12)",
            borderRadius: "16px",
            padding: "28px",
            color: "white",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "3rem",
              fontWeight: 800,
            }}
          >
            {data.points}
          </div>

          <div
            style={{
              opacity: 0.9,
              fontWeight: 600,
              marginTop: "4px",
            }}
          >
            TOTAL POINTS
          </div>
        </div>

        <div
          style={{
            background:
              "linear-gradient(135deg,#e74c3c,#c0392b)",
            borderRadius: "16px",
            padding: "28px",
            color: "white",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "3rem",
              fontWeight: 800,
            }}
          >
            {data.streak}🔥
          </div>

          <div
            style={{
              opacity: 0.9,
              fontWeight: 600,
              marginTop: "4px",
            }}
          >
            DAY STREAK
          </div>
        </div>

        <div
          style={{
            background:
              "linear-gradient(135deg,#8e44ad,#6c3483)",
            borderRadius: "16px",
            padding: "28px",
            color: "white",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "3rem",
              fontWeight: 800,
            }}
          >
            {data.badges?.length || 0}
          </div>

          <div
            style={{
              opacity: 0.9,
              fontWeight: 600,
              marginTop: "4px",
            }}
          >
            BADGES EARNED
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
        }}
      >
        {/* Badge Collection */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
          }}
        >
          <h3
            style={{
              margin: "0 0 16px",
              color: "#2d4a2d",
            }}
          >
            🎖️ Badge Collection
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            {Object.entries(BADGE_META).map(
              ([key, meta]) => {
                const earned =
                  data.badges?.includes(key);

                return (
                  <div
                    key={key}
                    style={{
                      padding: "14px",
                      borderRadius: "12px",
                      background: earned
                        ? "#f0fdf4"
                        : "#f8f8f8",
                      border: `1px solid ${
                        earned ? "#c8e6c9" : "#eee"
                      }`,
                      opacity: earned ? 1 : 0.65,
                    }}
                  >
                    <div style={{ fontSize: "1.8rem" }}>
                      {meta.icon}
                    </div>

                    <div
                      style={{
                        fontWeight: 600,
                        color: "#2d4a2d",
                        fontSize: "0.85rem",
                        marginTop: "6px",
                      }}
                    >
                      {meta.label}
                    </div>

                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "#777",
                        marginTop: "3px",
                      }}
                    >
                      {earned
                        ? meta.desc
                        : "Not unlocked yet"}
                    </div>

                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: earned
                          ? "#27ae60"
                          : "#999",
                      }}
                    >
                      {earned
                        ? "✓ Earned"
                        : "🔒 Locked"}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Right Side */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* How to earn */}
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px",
                color: "#2d4a2d",
              }}
            >
              💡 How to Earn Points
            </h3>

            {HOW_TO_EARN.map(
              ({ icon, action, pts }) => (
                <div
                  key={action}
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom:
                      "1px solid #f5f5f5",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <span>{icon}</span>
                    <span>{action}</span>
                  </div>

                  <span
                    style={{
                      background: "#f0fdf4",
                      color: "#27ae60",
                      padding: "3px 10px",
                      borderRadius: "20px",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                    }}
                  >
                    {pts}
                  </span>
                </div>
              )
            )}
          </div>

          {/* Redeem */}
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
            }}
          >
            <h3
              style={{
                margin: "0 0 8px",
                color: "#2d4a2d",
              }}
            >
              🎁 Redeem Points
            </h3>

            <p
              style={{
                color: "#888",
                fontSize: "0.8rem",
                margin: "0 0 14px",
              }}
            >
              You have{" "}
              <strong>{data.points}</strong> points
              available.
            </p>

            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <input
                type="number"
                placeholder="Enter points"
                value={redeemAmt}
                onChange={(e) =>
                  setRedeemAmt(e.target.value)
                }
                min={1}
                max={data.points}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                }}
              />

              <button
                onClick={handleRedeem}
                disabled={
                  !redeemAmt ||
                  parseInt(redeemAmt) > data.points
                }
                style={{
                  padding: "10px 18px",
                  background:
                    !redeemAmt ||
                    parseInt(redeemAmt) >
                      data.points
                      ? "#ccc"
                      : "#2d4a2d",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor:
                    !redeemAmt ||
                    parseInt(redeemAmt) >
                      data.points
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: 600,
                }}
              >
                Redeem
              </button>
            </div>

            {msg && (
              <div
                style={{
                  marginTop: "10px",
                  fontSize: "0.83rem",
                  color:
                    msgType === "success"
                      ? "#27ae60"
                      : "#e74c3c",
                  background:
                    msgType === "success"
                      ? "#f0fdf4"
                      : "#fef2f2",
                  padding: "8px 12px",
                  borderRadius: "7px",
                }}
              >
                {msg}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsPage;