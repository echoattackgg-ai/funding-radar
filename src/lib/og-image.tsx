import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

export function renderOgImage({ title, subtitle }: { title: string; subtitle: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#111113",
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          color: "#f4f4f5",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#fb923c" strokeOpacity="0.35" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="6.2" stroke="#fb923c" strokeOpacity="0.55" strokeWidth="1.5" />
            <line x1="12" y1="12" x2="19" y2="6" stroke="#fb923c" strokeWidth="1.75" strokeLinecap="round" />
            <circle cx="17" cy="8.2" r="1.6" fill="#fb923c" />
            <circle cx="12" cy="12" r="1.75" fill="#fb923c" />
          </svg>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 600 }}>
            <span style={{ color: "#f4f4f5" }}>Funding&nbsp;</span>
            <span style={{ color: "#fb923c" }}>Radar</span>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 48, fontSize: 56, fontWeight: 600, maxWidth: 980 }}>
          {title}
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 28, color: "#a1a1aa", maxWidth: 860 }}>
          {subtitle}
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
