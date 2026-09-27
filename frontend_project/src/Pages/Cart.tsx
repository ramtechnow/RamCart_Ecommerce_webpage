import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../features/checkout/hooks/useCart";
import { Trash2, ShoppingBag, ShieldCheck, ArrowRight } from "lucide-react";

export const Cart: React.FC = () => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();
  const navigate = useNavigate();

  const handleQtyChange = (productId: string, size: string, color: string, currentQty: number, increment: boolean) => {
    const nextQty = increment ? currentQty + 1 : currentQty - 1;
    updateQuantity(productId, size, color, nextQty);
  };

  return (
    <main className="container" style={{ padding: "32px var(--space-4) 80px", minHeight: "70vh", color: 'var(--text-primary)' }}>
      {/* Title */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.5px" }}>Shopping Bag</h1>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
          {cartCount} Items in your bag
        </p>
      </div>

      {cartCount === 0 ? (
        <div 
          style={{ 
            textAlign: "center", 
            padding: "60px 24px", 
            border: "1px dashed var(--border-color)", 
            borderRadius: "4px",
            backgroundColor: "var(--bg-secondary)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px"
          }}
        >
          <ShoppingBag size={42} style={{ color: "var(--text-muted)", opacity: 0.8 }} />
          <h3 style={{ margin: 0, fontWeight: "800", fontSize: "16px" }}>Your Shopping Bag is Empty</h3>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", maxWidth: "320px", lineHeight: "1.5" }}>
            Add items to your bag to start building your wardrobe collection.
          </p>
          <Link to="/catalog">
            <button 
              className="interactive-target"
              style={{
                backgroundColor: "var(--accent-pink)",
                color: "white",
                fontWeight: "700",
                padding: "0 24px",
                borderRadius: "4px",
                height: "40px",
                border: "none",
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              Continue Shopping
            </button>
          </Link>
        </div>
      ) : (
        <div className="cart-responsive-grid">
          {/* Left: Items list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {cartItems.map((item) => {
              // Brand label fallback
              const brandLabel = item.name.split(" ")[0] || "RamCart";
              return (
                <div 
                  key={item.id}
                  style={{
                    display: "flex",
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "4px",
                    padding: "16px",
                    alignItems: "center",
                    gap: "16px",
                    flexWrap: "wrap",
                    position: "relative"
                  }}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: "64px", height: "80px", objectFit: "cover", borderRadius: "4px", border: "1px solid var(--border-color)", flexShrink: 0 }}
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = "none";
                        const sibling = target.nextElementSibling as HTMLElement;
                        if (sibling) sibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div style={{
                    width: "64px", height: "80px", flexShrink: 0,
                    display: item.image ? "none" : "flex",
                    flexDirection: "column", alignItems: "center", justifyContent: "center",
                    backgroundColor: "var(--bg-secondary)", borderRadius: "4px",
                    border: "1px solid var(--border-color)",
                    padding: "4px", textAlign: "center", gap: "4px"
                  }}>
                    <span style={{ fontSize: "8px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Item</span>
                    <span style={{ fontSize: "9px", fontWeight: "600", color: "var(--text-secondary)", lineHeight: "1.2" }}>{item.name}</span>
                  </div>


                  {/* Info details */}
                  <div style={{ flexGrow: 1, minWidth: "180px", display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "850", color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {brandLabel}
                    </span>
                    <h3 style={{ fontSize: "13px", fontWeight: "400", color: "var(--text-secondary)", margin: 0 }}>
                      {item.name}
                    </h3>
                    <div style={{ display: "flex", gap: "10px", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      <span>Size: <strong>{item.size}</strong></span>
                      <span>Color: <strong>{item.color}</strong></span>
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: "800", color: "var(--text-primary)", marginTop: "4px" }}>
                      ₹{item.price.toFixed(0)}
                    </span>
                  </div>

                  {/* Qty count control */}
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border-color)", borderRadius: "4px", height: "32px", overflow: "hidden", backgroundColor: "var(--bg-primary)" }}>
                    <button 
                      onClick={() => handleQtyChange(item.productId, item.size, item.color, item.quantity, false)}
                      style={{ width: "28px", height: "100%", minHeight: "auto", fontWeight: "700", border: "none", background: "none", cursor: "pointer", color: "var(--text-primary)" }}
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span style={{ width: "28px", textAlign: "center", fontSize: "12px", fontWeight: "750" }}>{item.quantity}</span>
                    <button 
                      onClick={() => handleQtyChange(item.productId, item.size, item.color, item.quantity, true)}
                      style={{ width: "28px", height: "100%", minHeight: "auto", fontWeight: "700", border: "none", background: "none", cursor: "pointer", color: "var(--text-primary)" }}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  {/* Remove trigger */}
                  <button 
                    onClick={() => removeFromCart(item.productId, item.size, item.color)}
                    style={{ width: "32px", height: "32px", minHeight: "auto", borderRadius: "50%", color: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    title="Remove item"
                    aria-label={`Remove ${item.name} from bag`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right: Summary panel */}
          <div 
            style={{ 
              backgroundColor: "var(--bg-secondary)", 
              border: "1px solid var(--border-color)", 
              borderRadius: "4px", 
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              boxShadow: "var(--shadow-sm)"
            }}
          >
            <h2 style={{ fontSize: "12px", fontWeight: "800", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
              Price Details ({cartCount} Items)
            </h2>
            
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-secondary)" }}>
              <span>Total MRP:</span>
              <span>₹{cartTotal.toFixed(0)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-secondary)" }}>
              <span>Delivery Fee:</span>
              <span style={{ color: "var(--rating-green)", fontWeight: "700" }}>FREE</span>
            </div>

            <div style={{ height: "1px", backgroundColor: "var(--border-color)", margin: "4px 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "700" }}>
              <span>Total Amount:</span>
              <span style={{ color: "var(--accent-pink)", fontSize: "16px", fontWeight: "850" }}>₹{cartTotal.toFixed(0)}</span>
            </div>

            {/* Checkout Button */}
            <button 
              onClick={() => navigate("/checkout")}
              style={{
                width: "100%",
                height: "44px",
                backgroundColor: "var(--accent-pink)",
                color: "white",
                fontWeight: "750",
                borderRadius: "4px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(255, 63, 108, 0.15)",
                textTransform: "uppercase"
              }}
            >
              Place Order <ArrowRight size={14} />
            </button>

            {/* Secure note */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
              <ShieldCheck size={14} style={{ color: "var(--rating-green)", flexShrink: 0 }} />
              <span>100% Encrypted SSL Checkout &amp; Safe Transactions</span>
            </div>
          </div>
        </div>
      )}

      {/* Sticky mobile checkout button */}
      {cartCount > 0 && (
        <div className="mobile-sticky-checkout-bar">
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Total Amount</span>
            <span style={{ fontSize: "16px", fontWeight: "850", color: "var(--accent-pink)" }}>₹{cartTotal.toFixed(0)}</span>
          </div>
          <button 
            onClick={() => navigate("/checkout")}
            style={{
              backgroundColor: "var(--accent-pink)",
              color: "white",
              height: "40px",
              padding: "0 24px",
              borderRadius: "4px",
              fontWeight: "750",
              fontSize: "12px",
              border: "none",
              cursor: "pointer",
              textTransform: "uppercase"
            }}
          >
            Place Order
          </button>
        </div>
      )}

      <style>{`
        .mobile-sticky-checkout-bar {
          display: none;
        }
        @media (max-width: 768px) {
          .mobile-sticky-checkout-bar {
            display: flex;
            position: fixed;
            bottom: 60px; /* Above bottom nav */
            left: 0;
            right: 0;
            height: 60px;
            background-color: var(--bg-secondary);
            border-top: 1px solid var(--border-color);
            z-index: 850;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            box-shadow: 0 -2px 8px rgba(0,0,0,0.06);
          }
          body {
            padding-bottom: calc(120px + env(safe-area-inset-bottom, 0px)) !important;
          }
        }
      `}</style>
    </main>
  );
};

export default Cart;
