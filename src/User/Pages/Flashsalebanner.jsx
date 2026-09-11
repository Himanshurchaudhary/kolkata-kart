// ─── Flash Sale Banner ─────────────────────────────────────────────────────────
// Replace the existing FlashSaleBanner component with this one.
// Changes:
//   1. Flipkart-style flip countdown timer
//   2. objectPosition fixed to "center center" (no more top crop)
//   3. Entrance animation on mount

import { useState, useEffect, useRef } from "react";

const API_BASEA = import.meta.env.VITE_API_URL;

// ── Responsive hook (copy from your file or import) ─────────────────────────
const useResponsive = () => {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return {
    isMobile: width < 600,
    isTablet: width >= 600 && width < 1024,
    isDesktop: width >= 1024,
    width,
  };
};

// ── Single flip digit cell ───────────────────────────────────────────────────
const FlipCell = ({ value }) => {
  const [current, setCurrent] = useState(value);
  const [prev, setPrev] = useState(value);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (value !== current) {
      setPrev(current);
      setFlipping(true);
      const t = setTimeout(() => {
        setCurrent(value);
        setFlipping(false);
      }, 320);
      return () => clearTimeout(t);
    }
  }, [value]);

  const display = String(current).padStart(2, "0");
  const prevDisplay = String(prev).padStart(2, "0");

  return (
    <div
      style={{
        position: "relative",
        width: 38,
        height: 48,
        perspective: 300,
        flexShrink: 0,
      }}
    >
      <style>{`
        @keyframes flipTop {
          0%   { transform: rotateX(0deg); }
          100% { transform: rotateX(-90deg); }
        }
        @keyframes flipBottom {
          0%   { transform: rotateX(90deg); }
          100% { transform: rotateX(0deg); }
        }
      `}</style>

      {/* Static bottom half (new value) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#1a1a1a",
          borderRadius: 6,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* top half */}
        <div
          style={{
            height: "50%",
            background: "#222",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: 1,
            borderBottom: "1px solid #111",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#ffffff",
              WebkitTextFillColor: "#ffffff",
              lineHeight: 1,
              transform: "translateY(50%)",
            }}
          >
            {display}
          </span>
        </div>
        {/* bottom half */}
        <div
          style={{
            height: "50%",
            background: "#1a1a1a",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: 1,
            overflow: "hidden",
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#ffffff",
              WebkitTextFillColor: "#ffffff",
              lineHeight: 1,
              transform: "translateY(-50%)",
            }}
          >
            {display}
          </span>
        </div>
      </div>

      {/* Flipping top flap (old → rotates away) */}
      {flipping && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "50%",
            background: "#222",
            borderRadius: "6px 6px 0 0",
            overflow: "hidden",
            transformOrigin: "bottom center",
            animation: "flipTop 0.32s ease-in forwards",
            zIndex: 3,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: 1,
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#ffffff",
              WebkitTextFillColor: "#ffffff",
              lineHeight: 1,
              transform: "translateY(50%)",
            }}
          >
            {prevDisplay}
          </span>
        </div>
      )}

      {/* Flipping bottom flap (new value rotating in) */}
      {flipping && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "50%",
            background: "#1a1a1a",
            borderRadius: "0 0 6px 6px",
            overflow: "hidden",
            transformOrigin: "top center",
            animation: "flipBottom 0.32s ease-out 0.16s forwards",
            zIndex: 3,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: 1,
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#ffffff",
              WebkitTextFillColor: "#ffffff",
              lineHeight: 1,
              transform: "translateY(-50%)",
            }}
          >
            {display}
          </span>
        </div>
      )}
    </div>
  );
};

// ── Countdown timer (HH : MM : SS) ──────────────────────────────────────────
const FlipCountdown = ({ endDate, endTime }) => {
  const getRemaining = () => {
    if (!endDate) return { h: 0, m: 0, s: 0, expired: true };
    const end = new Date(endDate);
    if (endTime) {
      const [hh, mm] = endTime.split(":").map(Number);
      end.setHours(hh, mm, 0, 0);
    } else {
      end.setHours(23, 59, 59, 0);
    }
    const diff = Math.max(0, Math.floor((end - Date.now()) / 1000));
    return {
      h: Math.floor(diff / 3600),
      m: Math.floor((diff % 3600) / 60),
      s: diff % 60,
      expired: diff === 0,
    };
  };

  const [time, setTime] = useState(getRemaining);

  useEffect(() => {
    const id = setInterval(() => setTime(getRemaining()), 1000);
    return () => clearInterval(id);
  }, [endDate, endTime]);

  if (time.expired) return null;

  const Colon = () => (
    <span
      style={{
        fontSize: 20,
        fontWeight: 900,
        color: "#ffe600",
        alignSelf: "center",
        lineHeight: 1,
        margin: "0 2px",
        animation: "colonBlink 1s step-start infinite",
      }}
    >
      :
    </span>
  );

  return (
    <>
      <style>{`
        @keyframes colonBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
      `}</style>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          background: "rgba(0,0,0,0.45)",
          borderRadius: 10,
          padding: "8px 12px",
          backdropFilter: "blur(4px)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <FlipCell value={time.h} />
          <span style={{ fontSize: 9, color: "#ffffff", WebkitTextFillColor: "#ffffff", fontWeight: 700, letterSpacing: 0.5 }}>HRS</span>
        </div>
        <Colon />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <FlipCell value={time.m} />
          <span style={{ fontSize: 9, color: "#ffffff", WebkitTextFillColor: "#ffffff", fontWeight: 700, letterSpacing: 0.5 }}>MIN</span>
        </div>
        <Colon />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <FlipCell value={time.s} />
          <span style={{ fontSize: 9, color: "#ffffff", WebkitTextFillColor: "#ffffff", fontWeight: 700, letterSpacing: 0.5 }}>SEC</span>
        </div>
      </div>
    </>
  );
};

// ── Main Banner ──────────────────────────────────────────────────────────────
const FlashSaleBanner = ({ onFlashSaleClick }) => {
  const { isMobile, isTablet } = useResponsive();
  const [flashSale, setFlashSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch(`${API_BASEA}/api/flash/all`)
      .then((r) => r.json())
      .then((data) => {
        const sales = data.sales || data.flashSales || data.data || [];
        const active = sales.find((s) => s.isActive) || sales[0];
        if (active) setFlashSale(active);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        // slight delay so skeleton fades out first
        setTimeout(() => setVisible(true), 80);
      });
  }, []);

  const discountBadge = flashSale?.minDiscount;
  const height = isMobile ? 300 : isTablet ? 360 : 440;

  // ── Pick correct media ──
  const mediaUrl = isMobile
    ? flashSale?.mobileMedia || flashSale?.desktopMedia
    : flashSale?.desktopMedia || flashSale?.mobileMedia;
  const mediaType = isMobile
    ? flashSale?.mobileMediaType || flashSale?.desktopMediaType
    : flashSale?.desktopMediaType || flashSale?.mobileMediaType;
  const isVideo = mediaType === "video";

  if (loading) {
    return (
      <div
        style={{
          width: "100%",
          height,
          borderRadius: 14,
          background: "#f0f0f0",
          marginBottom: isMobile ? 28 : isTablet ? 40 : 72,
          animation: "pulse 1.4s ease-in-out infinite",
        }}
      />
    );
  }

  if (!flashSale) return null;

  return (
    <section
      style={{
        marginBottom: isMobile ? 28 : isTablet ? 40 : 72,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.55s ease, transform 0.55s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <h2
          style={{
            fontSize: isMobile ? 15 : 18,
            fontWeight: 700,
            color: "#1a1a1a",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ color: "#ffe600", filter: "drop-shadow(0 0 4px #ff6b00)" }}>⚡</span>{" "}
          Flash Sale
        </h2>
        <span style={{ color: "#2d9e2d", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          View All
        </span>
      </div>

      {/* Banner card */}
      <div
        onClick={() => onFlashSaleClick(flashSale?.id || null)}
        style={{
          width: "100%",
          borderRadius: 14,
          overflow: "hidden",
          position: "relative",
          background: "#1a5c1a",
          boxShadow: "0 4px 18px rgba(0,0,0,0.18)",
          cursor: "pointer",
          height,
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.008)";
          e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.28)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,0.18)";
        }}
      >
        {/* ── Media (image / video) — objectPosition fixed ── */}
        {mediaUrl ? (
          isVideo ? (
            <video
              key={mediaUrl}
              src={mediaUrl}
              autoPlay
              muted
              loop
              playsInline
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center center", // ✅ FIX: was "center 30%" → cropped top
              }}
            />
          ) : (
            <img
              key={mediaUrl}
              src={mediaUrl}
              alt={flashSale.name || "Flash Sale"}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center center", // ✅ FIX: was "center 30%" → cropped top
              }}
            />
          )
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(160deg, #1a7a1a 0%, #0d4d0d 100%)",
            }}
          />
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.18) 55%, rgba(0,0,0,0.04) 100%)",
          }}
        />

        {/* Discount badge */}
        {discountBadge && (
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 2,
              width: isMobile ? 56 : 72,
              height: isMobile ? 56 : 72,
              borderRadius: "50%",
              background: "#2d9e2d",
              border: "2.5px solid rgba(255,255,255,0.7)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              animation: "pulseBadge 1.8s ease-in-out infinite",
            }}
          >
            <span
              style={{
                fontSize: isMobile ? 16 : 20,
                fontWeight: 900,
                color: "#0c0c0c",
                lineHeight: 1,
              }}
            >
              {discountBadge}%
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "#0c0c0c",
                lineHeight: 1.2,
              }}
            >
              OFF
            </span>
          </div>
        )}

        {/* TAP TO EXPLORE */}
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            zIndex: 2,
            background: "#0a77f8",
            border: "1px solid rgba(255,230,0,0.4)",
            borderRadius: 6,
            padding: "4px 10px",
            fontSize: isMobile ? 9 : 10,
            fontWeight: 700,
            color: "#ffe600",
            letterSpacing: 0.5,
          }}
        >
          TAP TO EXPLORE →
        </div>

        {/* Bottom content */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            padding: isMobile ? "16px 14px 16px" : "20px 28px 22px",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "flex-end",
            justifyContent: "space-between",
            gap: isMobile ? 10 : 20,
          }}
        >
          {/* Left: title + countdown */}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: isMobile ? 20 : 28,
                fontWeight: 900,
                color: "#ffffff !important",
                WebkitTextFillColor: "#ffffff",
                lineHeight: 1.15,
                marginBottom: 10,
                letterSpacing: -0.5,
                textShadow: "0 2px 12px rgba(0,0,0,0.8)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                filter: "none",
                background: "none",
                WebkitBackgroundClip: "unset",
              }}
            >
              <span style={{ color: "#ffe600", WebkitTextFillColor: "#ffe600" }}>⚡</span>{" "}
              <span style={{ color: "#0c0c0c", WebkitTextFillColor: "#f3e154" }}>
                {flashSale?.name || "Flash Sale"}
              </span>
            </div>

            {/* ✅ Flip countdown */}
            {flashSale?.endDate && (
              <FlipCountdown
                endDate={flashSale.endDate}
                endTime={flashSale.endTime}
              />
            )}
          </div>

          {/* Right: CTA button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFlashSaleClick(flashSale?.id || null);
            }}
            style={{
              padding: isMobile ? "12px 0" : "12px 32px",
              background: "#ffe600",
              color: "#111",
              border: "none",
              borderRadius: 8,
              fontWeight: 900,
              fontSize: 14,
              cursor: "pointer",
              letterSpacing: 0.5,
              transition: "opacity 0.2s, transform 0.15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              width: isMobile ? "100%" : "auto",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.88";
              e.currentTarget.style.transform = "scale(1.04)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            ORDER NOW ⚡
          </button>
        </div>
      </div>

      {/* Keyframes for badge pulse */}
      <style>{`
        @keyframes pulseBadge {
          0%, 100% { transform: scale(1);    box-shadow: 0 0 0   0 rgba(45,158,45,0.5); }
          50%       { transform: scale(1.06); box-shadow: 0 0 0 8px rgba(45,158,45,0);   }
        }
      `}</style>
    </section>
  );
};

export default FlashSaleBanner;