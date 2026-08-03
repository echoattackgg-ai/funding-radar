import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111113",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#fb923c" strokeOpacity="0.35" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="6.2" stroke="#fb923c" strokeOpacity="0.55" strokeWidth="1.5" />
          <line x1="12" y1="12" x2="19" y2="6" stroke="#fb923c" strokeWidth="1.75" strokeLinecap="round" />
          <circle cx="17" cy="8.2" r="1.6" fill="#fb923c" />
          <circle cx="12" cy="12" r="1.75" fill="#fb923c" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
