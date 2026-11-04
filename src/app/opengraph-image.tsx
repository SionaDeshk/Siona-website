import { ImageResponse } from "next/og";

export const alt = "SIONA — The path is the way.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ background: "#f4f3ee", color: "#262a25", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "80px" }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 115, letterSpacing: "-7px", lineHeight: 1 }}>SIONA</div>
        <div style={{ fontSize: 34, marginTop: 32 }}>The path is the way.</div>
        <div style={{ fontSize: 13, color: "#69705e", marginTop: 90, letterSpacing: "2px" }}>PEOPLE. TECHNOLOGY. HEALTHCARE.</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 390, height: 390, background: "#e5e5dc" }}>
        <svg width="280" height="280" viewBox="0 0 380 360" fill="none">
          <path d="M148 36H368L308 96H172L120 148H280L344 212L232 324H12L72 264H208L260 212H100L36 148L148 36Z" fill="#626957" />
          <path d="M36 148H280L344 212H100L36 148Z" fill="#3d4439" />
        </svg>
      </div>
    </div>,
    size,
  );
}
