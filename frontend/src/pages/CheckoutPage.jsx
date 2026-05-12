import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

/**
 * Utility to load Razorpay Checkout Script
 */
const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Order Summary Sub-component
 */
const OrderSummary = ({ items, totalPrice }) => {
  const subtotal = totalPrice;
  const shipping = 0; // Free shipping
  const tax = totalPrice * 0.18; // 18% GST
  const finalTotal = subtotal + tax;

  return (
    <div className="card" style={{ padding: "28px", position: "sticky", top: "100px" }}>
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "var(--forest)", marginBottom: "20px" }}>
        Order Summary
      </h3>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
        {items.map((item) => (
          <div key={item.id} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "10px",
              background: "var(--cream)", overflow: "hidden", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid var(--border)"
            }}>
              {item.image ? (
                <img src={item.image} alt={item.name} 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                  onError={e => { e.target.src = "https://via.placeholder.com/50?text=🧴"; }}
                />
              ) : <span style={{ fontSize: "1.5rem" }}>🧴</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--charcoal)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {item.name}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Qty: {item.quantity}</p>
            </div>
            <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--forest)" }}>
              ₹{(parseFloat(item.price?.replace(/[^0-9.]/g, "") || 0) * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Subtotal</span>
          <span style={{ fontSize: "0.9rem", color: "var(--charcoal)" }}>₹{subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Shipping</span>
          <span style={{ fontSize: "0.9rem", color: "#10b981", fontWeight: 500 }}>FREE</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Estimated GST (18%)</span>
          <span style={{ fontSize: "0.9rem", color: "var(--charcoal)" }}>₹{tax.toFixed(2)}</span>
        </div>
        
        <div style={{ 
          display: "flex", justifyContent: "space-between", 
          borderTop: "2px solid var(--forest)", paddingTop: "16px", marginTop: "8px" 
        }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "var(--forest)", fontWeight: 600 }}>Total</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "var(--forest)", fontWeight: 600 }}>
            ₹{finalTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Trust Badges */}
      <div style={{ marginTop: "24px", padding: "16px", background: "var(--cream)", borderRadius: "12px", textAlign: "center" }}>
        <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Secure Checkout Powered by Razorpay
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
          {["Visa", "Mastercard", "UPI", "NetBanking"].map(m => (
            <span key={m} style={{ 
              background: "white", padding: "4px 8px", borderRadius: "4px", 
              fontSize: "0.65rem", fontWeight: 600, border: "1px solid var(--border)"
            }}>{m}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Main Checkout Page Component
 */
const CheckoutPage = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    upiId: "",
  });

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate("/analyze");
    }
  }, [items, navigate]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handlePayment = async () => {
    // 1. Validation
    if (!form.phone || form.phone.length < 10) return setError("Please enter a valid 10-digit mobile number.");
    if (!form.address || !form.city || !form.pincode) return setError("Please complete your delivery address.");

    // 2. Token Check (Critical for the 401 error)
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Session expired. Please log in again to continue.");
      return setTimeout(() => navigate("/login"), 2000);
    }

    setLoading(true);
    setError("");

    try {
      const amountWithTax = totalPrice * 1.18;

      // STEP 1: Create Order on Backend
      const orderRes = await axios.post(
        "/api/payment/create-order",
        {
          amount: amountWithTax,
          currency: "INR",
          items: items.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity })),
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json" 
          }
        }
      );

      if (!orderRes.data.success) throw new Error("Could not initialize transaction.");

      // STEP 2: Load Razorpay SDK
      const isLoaded = await loadRazorpay();
      if (!isLoaded) throw new Error("Razorpay failed to load. Check your connection.");

      // STEP 3: Configure Razorpay Options
      const options = {
        key: orderRes.data.keyId,
        amount: orderRes.data.amount,
        currency: orderRes.data.currency,
        name: "DermisAI",
        description: `Order for ${items.length} item(s)`,
        image: "/logo.png", // Replace with your actual logo path
        order_id: orderRes.data.orderId,
        prefill: {
          name: form.name,
          email: form.email,
          contact: `+91${form.phone}`,
          ...(form.upiId && { vpa: form.upiId }),
        },
        notes: {
          shipping_address: `${form.address}, ${form.city} - ${form.pincode}`,
        },
        theme: { color: "#1a3a2a" },
        handler: async (response) => {
          try {
            // STEP 4: Verify Payment on Backend
            const verifyRes = await axios.post(
              "/api/payment/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );

            if (verifyRes.data.success) {
              clearCart();
              navigate("/payment-success", {
                state: {
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                  amount: amountWithTax,
                  items,
                },
              });
            } else {
              setError("Payment verification failed. Please contact support.");
            }
          } catch (err) {
            setError("Error verifying payment. Do not refresh the page.");
          }
          setLoading(false);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError("Payment cancelled. You can try again whenever you're ready.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error("Checkout Error:", err);
      if (err.response?.status === 401) {
        setError("Your session has timed out. Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(err.response?.data?.message || err.message || "Something went wrong. Please try again.");
      }
      setLoading(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="page-wrapper" style={{ background: "var(--warm-white)", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 40px" }}>
        
        {/* Page Title */}
        <div className="fade-up" style={{ marginBottom: "48px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.8rem", color: "var(--forest)", fontWeight: 400 }}>
            Checkout
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", marginTop: "8px" }}>
            Review your order and provide delivery details.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: "40px", alignItems: "start" }}>
          
          {/* Main Content Area */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            
            {/* Delivery Form */}
            <div className="card" style={{ padding: "32px" }}>
              <h3 style={{ 
                fontFamily: "var(--font-display)", fontSize: "1.5rem", 
                color: "var(--forest)", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" 
              }}>
                <span>📦</span> Delivery Information
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Full Name</label>
                  <input 
                    className="form-input" 
                    name="name" 
                    value={form.name} 
                    onChange={handleChange} 
                    placeholder="Enter your full name" 
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    className="form-input" 
                    type="email" 
                    name="email" 
                    value={form.email} 
                    onChange={handleChange} 
                    placeholder="you@example.com" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ 
                      position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
                      fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 600
                    }}>+91</span>
                    <input 
                      className="form-input" 
                      name="phone" 
                      value={form.phone} 
                      onChange={handleChange} 
                      placeholder="00000 00000" 
                      maxLength={10} 
                      style={{ paddingLeft: "48px" }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Complete Address</label>
                  <textarea 
                    className="form-input" 
                    name="address" 
                    value={form.address} 
                    onChange={handleChange} 
                    placeholder="Flat/House No., Building, Apartment, Street"
                    style={{ minHeight: "80px", resize: "none", padding: "12px 16px" }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">City</label>
                  <input 
                    className="form-input" 
                    name="city" 
                    value={form.city} 
                    onChange={handleChange} 
                    placeholder="e.g. Mumbai" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">PIN Code</label>
                  <input 
                    className="form-input" 
                    name="pincode" 
                    value={form.pincode} 
                    onChange={handleChange} 
                    placeholder="6 digits" 
                    maxLength={6}
                  />
                </div>
              </div>
            </div>

            {/* Payment Info Box */}
            <div className="card" style={{ padding: "32px", borderLeft: "4px solid var(--forest)" }}>
              <h3 style={{ 
                fontFamily: "var(--font-display)", fontSize: "1.5rem", 
                color: "var(--forest)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "12px" 
              }}>
                <span>💳</span> Payment Method
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "20px", lineHeight: 1.6 }}>
                Clicking the button below will open the secure <strong>Razorpay</strong> gateway. 
                You can pay using UPI, Credit/Debit Cards, NetBanking, or Wallets.
              </p>
              
              <div className="form-group">
                <label className="form-label">Preferred UPI ID (Optional)</label>
                <input 
                  className="form-input" 
                  name="upiId" 
                  value={form.upiId} 
                  onChange={handleChange} 
                  placeholder="username@upi" 
                />
              </div>

              {/* Security Banner */}
              <div style={{ 
                marginTop: "24px", background: "rgba(26,58,42,0.05)", 
                borderRadius: "12px", padding: "16px", display: "flex", gap: "16px", alignItems: "center" 
              }}>
                <div style={{ fontSize: "1.8rem" }}>🛡️</div>
                <div>
                  <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--forest)" }}>End-to-End Encrypted</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Your payment data is processed securely by Razorpay. DermisAI does not store your card details.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="fade-up" style={{ 
                padding: "16px 20px", background: "#fff1f2", border: "1px solid #fda4af",
                borderRadius: "12px", color: "#be123c", fontSize: "0.95rem", display: "flex", gap: "12px", alignItems: "center"
              }}>
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handlePayment}
              disabled={loading}
              className="btn btn-primary"
              style={{ 
                padding: "18px", fontSize: "1.1rem", width: "100%", 
                boxShadow: "0 10px 25px rgba(26,58,42,0.15)",
                display: "flex", justifyContent: "center", alignItems: "center", gap: "12px"
              }}
            >
              {loading ? (
                <>
                  <div className="spinner" /> Opening Secure Gateway...
                </>
              ) : (
                `Complete Secure Payment • ₹${(totalPrice * 1.18).toFixed(2)}`
              )}
            </button>
          </div>

          {/* Right Sidebar Area */}
          <div style={{ position: "sticky", top: "100px" }}>
            <OrderSummary items={items} totalPrice={totalPrice} />
            
            <button 
              onClick={() => navigate("/analyze")}
              style={{ 
                width: "100%", background: "none", border: "none", 
                marginTop: "20px", color: "var(--text-muted)", 
                fontSize: "0.9rem", cursor: "pointer", textDecoration: "underline" 
              }}
            >
              ← Back to Recommendations
            </button>
          </div>

        </div>
      </div>

      {/* Internal CSS for Spinner and Animations */}
      <style>{`
        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up {
          animation: fadeUp 0.5s ease forwards;
        }
      `}</style>
    </div>
  );
};

export default CheckoutPage;