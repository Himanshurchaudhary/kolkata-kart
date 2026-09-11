
import { useState, useEffect } from "react";

const CartToast = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const id = Date.now() + Math.random();
      const { name, image } = e.detail || {};

      setToasts((prev) => [...prev, { id, name, image, exiting: false }]);

      // start exit animation after 2.8s, remove from DOM after 3.2s
      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
        );
      }, 2800);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3200);
    };

    window.addEventListener("cart:added", handler);
    return () => window.removeEventListener("cart:added", handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(110%); }
          to   { opacity: 1; transform: translateX(0);    }
        }
        @keyframes toastSlideOut {
          from { opacity: 1; transform: translateX(0);    }
          to   { opacity: 0; transform: translateX(110%); }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%;   }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 20,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          alignItems: "flex-end",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "#fff",
              borderRadius: 12,
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(45,158,45,0.10)",
              padding: "10px 16px 10px 10px",
              minWidth: 260,
              maxWidth: 320,
              border: "1.5px solid #e8f5e9",
              position: "relative",
              overflow: "hidden",
              animation: toast.exiting
                ? "toastSlideOut 0.38s cubic-bezier(0.4,0,1,1) forwards"
                : "toastSlideIn 0.38s cubic-bezier(0,0,0.2,1) forwards",
              pointerEvents: "auto",
            }}
          >
            {/* Product image or fallback */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                overflow: "hidden",
                flexShrink: 0,
                background: "#f0f9f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #e8f5e9",
              }}
            >
              {toast.image ? (
                <img
                  src={toast.image}
                  alt={toast.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: 24 }}>🛒</span>
              )}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 2,
                }}
              >
                {/* Green checkmark */}
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#2d9e2d",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <polyline
                      points="1.5,5 4,7.5 8.5,2.5"
                      stroke="#fff"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span
                  style={{ fontSize: 12, fontWeight: 800, color: "#2d9e2d" }}
                >
                  Added to Cart!
                </span>
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: "#555",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {toast.name || "Product"}
              </div>
            </div>

            {/* Progress bar */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                height: 3,
                background: "#2d9e2d",
                borderRadius: "0 0 0 12px",
                animation: "toastProgress 3s linear forwards",
              }}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default CartToast;