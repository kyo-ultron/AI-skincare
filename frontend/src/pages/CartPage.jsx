import { useCart } from "../context/CartContext";
import { Link, useNavigate } from "react-router-dom";

const CartPage = () => {
  const { items, removeFromCart, updateQuantity, totalItems, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="page-wrapper" style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px" }}>
        <div style={{ fontSize: "4rem" }}>🛒</div>
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--forest)", fontWeight: 400 }}>Your cart is empty</h2>
        <p style={{ color: "var(--text-muted)" }}>Get a skin analysis to receive product recommendations.</p>
        <Link to="/analyze" className="btn btn-primary" style={{ padding: "12px 32px" }}>Analyse My Skin →</Link>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ background: "var(--warm-white)", minHeight: "100vh" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 40px" }}>

        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", color: "var(--forest)", fontWeight: 400, marginBottom: "8px" }}>
          Your <span style={{ fontStyle: "italic", color: "var(--rose-gold)" }}>Cart</span>
        </h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "40px" }}>{totalItems} item{totalItems !== 1 ? "s" : ""}</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "32px", alignItems: "start" }}>

          {/* Items list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {items.map((item) => (
              <div key={item.id} className="card" style={{ padding: "20px", display: "flex", gap: "20px", alignItems: "center" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "12px", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", flexShrink: 0, overflow: "hidden" }}>
                  {item.image
                    ? <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : "🧴"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--rose-gold)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.brand}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "var(--charcoal)", marginBottom: "4px" }}>{item.name}</div>
                  <div style={{ fontWeight: 500, color: "var(--forest)" }}>{item.price}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    style={{ width: "30px", height: "30px", borderRadius: "50%", border: "1px solid var(--border)", background: "white", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                  <span style={{ minWidth: "20px", textAlign: "center", fontWeight: 500 }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    style={{ width: "30px", height: "30px", borderRadius: "50%", border: "1px solid var(--border)", background: "white", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                </div>
                <button onClick={() => removeFromCart(item.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "1.2rem", padding: "4px" }}>✕</button>
              </div>
            ))}

            <button onClick={clearCart} style={{ alignSelf: "flex-start", background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.85rem", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
              Clear cart
            </button>
          </div>

          {/* Order summary */}
          <div className="card" style={{ padding: "28px", position: "sticky", top: "24px" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "var(--forest)", marginBottom: "20px" }}>Order Summary</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              {items.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", color: "var(--charcoal)" }}>
                  <span>{item.name} × {item.quantity}</span>
                  <span>₹{(parseFloat(item.price?.replace(/[^0-9.]/g, "") || 0) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: "1rem", color: "var(--forest)", marginBottom: "24px" }}>
              <span>Total</span>
              <span>₹{totalPrice.toFixed(2)}</span>
            </div>
            <button
              onClick={() => navigate("/checkout")}
              className="btn btn-primary"
              style={{ width: "100%", padding: "14px", fontSize: "0.95rem" }}
            >
              Proceed to Checkout →
            </button>
            <Link to="/analyze" style={{ display: "block", textAlign: "center", marginTop: "12px", fontSize: "0.82rem", color: "var(--text-muted)" }}>
              ← Continue Shopping
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CartPage;