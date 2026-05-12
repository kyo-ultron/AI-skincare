import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const CoachPage = () => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  const API_BASE_URL = "/api/coach";

  // Auto-scroll to latest message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ FIX: On mount, try to load history first.
  // If history exists, show it. If not, call /greeting for a personalized
  // AI-generated welcome. Both failures fall back to a static welcome message.
  useEffect(() => {
    const initCoach = async () => {
      if (!token) return;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      try {
        const historyRes = await axios.get(`${API_BASE_URL}/history`, config);

        if (historyRes.data.messages && historyRes.data.messages.length > 0) {
          // Returning user — restore their conversation
          setMessages(historyRes.data.messages);
          return;
        }
      } catch (err) {
        console.warn("Could not load history:", err.message);
        // Don't bail — fall through to greeting
      }

      // New user or empty history — fetch an AI greeting
      try {
        const greetRes = await axios.get(`${API_BASE_URL}/greeting`, config);
        setMessages([
          {
            role: "assistant",
            content: greetRes.data.greeting,
          },
        ]);
      } catch (err) {
        console.warn("Could not load greeting:", err.message);
        // Final static fallback
        setMessages([
          {
            role: "assistant",
            content: `Hi ${user?.name?.split(" ")[0] || "there"}! 👋 I'm your DermisAI Coach, powered by Gemini. I know your skin history and I'm here to help you build the perfect skincare routine. Ask me anything — from product advice to ingredient questions!`,
          },
        ]);
      }
    };

    initCoach();
  }, [token]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const userMsg = { role: "user", content: userText };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/chat`,
        { message: userText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const coachMsg = { role: "assistant", content: res.data.reply };
      setMessages((prev) => [...prev, coachMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      // ✅ FIX: Show the server's error message if available, otherwise generic
      const serverMsg = err.response?.data?.message;
      setError(serverMsg || "Couldn't reach the coach. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key (Shift+Enter for newline)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Clear chat history
  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to delete your chat history?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages([
        {
          role: "assistant",
          content: "Chat cleared! How can I help you with your skincare today? 🌿",
        },
      ]);
    } catch (err) {
      setError("Failed to clear history.");
    }
  };

  return (
    <div
      style={{
        paddingTop: "100px",
        maxWidth: "900px",
        margin: "0 auto",
        paddingLeft: "20px",
        paddingRight: "20px",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        paddingBottom: "40px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--forest)",
              marginBottom: "4px",
              fontSize: "2rem",
            }}
          >
            Dermis<span style={{ fontStyle: "italic", color: "var(--rose-gold)" }}>AI</span> Coach
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Powered by Gemini • Knows your skin history
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link
            to="/dashboard"
            className="btn btn-outline"
            style={{ fontSize: "0.8rem", padding: "8px 16px" }}
          >
            View Dashboard
          </Link>
          <button
            onClick={handleClearHistory}
            style={{
              background: "none",
              border: "none",
              color: "#e74c3c",
              cursor: "pointer",
              fontSize: "0.8rem",
              textDecoration: "underline",
            }}
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div
        style={{
          flex: 1,
          backgroundColor: "#fff",
          borderRadius: "16px",
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          overflow: "hidden",
          minHeight: "500px",
        }}
      >
        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                marginBottom: "20px",
              }}
            >
              {/* Avatar for assistant */}
              {msg.role === "assistant" && (
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "var(--forest)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    marginRight: "10px",
                    flexShrink: 0,
                    alignSelf: "flex-end",
                  }}
                >
                  🌿
                </div>
              )}

              <div
                style={{
                  maxWidth: "75%",
                  padding: "12px 18px",
                  borderRadius:
                    msg.role === "user" ? "18px 18px 2px 18px" : "18px 18px 18px 2px",
                  backgroundColor:
                    msg.role === "user" ? "var(--forest)" : "#f1f5f3",
                  color: msg.role === "user" ? "white" : "var(--charcoal)",
                  lineHeight: "1.6",
                  fontSize: "0.93rem",
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.content}
              </div>

              {/* Avatar for user */}
              {msg.role === "user" && (
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "var(--sage)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--forest)",
                    marginLeft: "10px",
                    flexShrink: 0,
                    alignSelf: "flex-end",
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: "var(--forest)", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: "14px",
                }}
              >
                🌿
              </div>
              <div
                style={{
                  background: "#f1f5f3", borderRadius: "18px 18px 18px 2px",
                  padding: "12px 18px", display: "flex", gap: "5px", alignItems: "center",
                }}
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: "7px", height: "7px", borderRadius: "50%",
                      background: "var(--sage)",
                      animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                backgroundColor: "#fff5f5",
                color: "#c0392b",
                padding: "12px 16px",
                borderRadius: "10px",
                fontSize: "0.85rem",
                textAlign: "center",
                border: "1px solid #feb2b2",
                marginTop: "10px",
              }}
            >
              {error}
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSendMessage}
          style={{
            padding: "16px 20px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: "12px",
            backgroundColor: "#fafaf8",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            style={{
              flex: 1,
              padding: "12px 20px",
              borderRadius: "30px",
              border: "1.5px solid var(--border)",
              outline: "none",
              fontSize: "0.93rem",
              fontFamily: "var(--font-body)",
              background: "white",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--forest)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn btn-primary"
            style={{ borderRadius: "30px", padding: "12px 24px", flexShrink: 0 }}
          >
            Send
          </button>
        </form>
      </div>

      <p
        style={{
          textAlign: "center",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          marginTop: "14px",
        }}
      >
        Your skin history is always in context. Enter to send • Shift+Enter for new line.
      </p>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
};

export default CoachPage;