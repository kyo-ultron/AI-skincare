import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

const CartDrawer = () => {
  const { items, isOpen, setIsOpen, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={() => setIsOpen(false)}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          zIndex: 200, backdropFilter: "blur(2px)",
        }}
      />
      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "420px",
        background: "var(--warm-white)", zIndex: 201,
        display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
        animation: "slideIn 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <style>{`
          @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        `}</style>
        {/* Header */}
        <div style={{
          padding: "24px 28px", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "white",
        }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", color: "var(--forest)", fontWeight: 400 }}>
              Your Cart
            </h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </p>
          </div>
          <button onClick={() => setIsOpen(false)} style={{
            background: "var(--cream)", border: "none", borderRadius: "50%",
            width: "36px", height: "36px", cursor: "pointer", fontSize: "1.1rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--charcoal)",
          }}>✕</button>
        </div>
        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", paddingTop: "60px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🛍️</div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "var(--forest)", marginBottom: "8px" }}>
                Your cart is empty
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
                Add products from your skin analysis
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {items.map((item) => (
                <div key={item.id} style={{
                  background: "white", borderRadius: "14px",
                  padding: "16px", border: "1px solid var(--border)",
                  display: "flex", gap: "14px", alignItems: "center",
                }}>
                  {/* Image */}
                  <div style={{
                    width: "68px", height: "68px", borderRadius: "10px",
                    background: "var(--cream)", overflow: "hidden", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={e => { e.target.style.display = "none"; }}
                      />
                    ) : <span style={{ fontSize: "1.6rem" }}>🧴</span>}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.7rem", color: "var(--rose-gold)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {item.brand}
                    </p>
                    <p style={{
                      fontSize: "0.88rem", color: "var(--charcoal)", fontWeight: 500,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>{item.name}</p>
                    <p style={{ fontSize: "0.9rem", color: "var(--forest)", fontWeight: 600, marginTop: "2px" }}>
                      {item.price}
                    </p>
                  </div>
                  {/* Quantity + Remove */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        style={{
                          width: "26px", height: "26px", borderRadius: "50%",
                          border: "1.5px solid var(--border)", background: "white",
                          cursor: "pointer", fontSize: "0.9rem", color: "var(--forest)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>−</button>
                      <span style={{ fontSize: "0.9rem", fontWeight: 500, minWidth: "20px", textAlign: "center" }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        style={{
                          width: "26px", height: "26px", borderRadius: "50%",
                          border: "1.5px solid var(--border)", background: "white",
                          cursor: "pointer", fontSize: "0.9rem", color: "var(--forest)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>+</button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        background: "none", border: "none", color: "#ef4444",
                        fontSize: "0.75rem", cursor: "pointer", padding: 0,
                      }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Footer */}
        {items.length > 0 && (          <div style={{
            padding: "20px 28px", borderTop: "1px solid var(--border)",
            background: "white",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Subtotal</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "var(--forest)", fontWeight: 500 }}>
                ₹{totalPrice.toFixed(2)}
              </span>
            </div>
            <button
              onClick={() => { setIsOpen(false); navigate("/checkout"); }}
              className="btn btn-primary"
              style={{ width: "100%", padding: "14px", fontSize: "0.95rem" }}
            >
              Proceed to Checkout →
            </button>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                width: "100%", marginTop: "10px", background: "none", border: "none",
                color: "var(--text-muted)", fontSize: "0.85rem", cursor: "pointer",
                padding: "8px",
              }}
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;