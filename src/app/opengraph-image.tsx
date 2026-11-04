import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "SIONA — The path is the way.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const [stone, symbol] = await Promise.all([
    readFile(join(process.cwd(), "src/assets/brand/onyx.jpg")),
    readFile(join(process.cwd(), "src/assets/brand/siona-symbol.png")),
  ]);
  const imageData = (file: Buffer, type: "jpeg" | "png") => `data:image/${type};base64,${file.toString("base64")}`;
  return new ImageResponse(
    <div style={{ background: "#f6f2e9", color: "#242625", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "80px", position: "relative" }}>
      <img src={imageData(stone, "jpeg")} alt="" width={1200} height={630} style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }} />
      <div style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, background: "linear-gradient(90deg, rgba(246,242,233,0.97), rgba(246,242,233,0.9) 45%, rgba(246,242,233,0.25))" }} />
      <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
        <div style={{ fontSize: 115, letterSpacing: "-7px", lineHeight: 1 }}>SIONA</div>
        <div style={{ fontSize: 34, marginTop: 32 }}>The path is the way.</div>
        <div style={{ fontSize: 13, color: "#5d6359", marginTop: 90, letterSpacing: "2px" }}>PEOPLE. TECHNOLOGY. HEALTHCARE.</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 390, height: 390, position: "relative" }}>
        <img src={imageData(symbol, "png")} alt="" width={370} height={370} style={{ objectFit: "contain" }} />
      </div>
    </div>,
    size,
  );
}
