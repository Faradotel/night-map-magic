import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { FONT_ANTON, FONT_INTER } from "../lib/fonts";

export const Scene8 = () => {
  const frame = useCurrentFrame();

  const logo = spring({ frame, fps: 30, config: { damping: 11, stiffness: 200 } });
  const line1 = spring({ frame: frame - 12, fps: 30, config: { damping: 10, stiffness: 200 } });
  const line2 = spring({ frame: frame - 24, fps: 30, config: { damping: 10, stiffness: 200 } });
  const cta = spring({ frame: frame - 36, fps: 30, config: { damping: 8, stiffness: 220 } });
  const pulse = 1 + Math.sin(frame * 0.35) * 0.05;
  const arrow = Math.sin(frame * 0.4) * 12;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
        fontFamily: FONT_ANTON,
      }}
    >
      <div
        style={{
          transform: `scale(${logo})`,
          fontSize: 130,
          color: "#FFF",
          letterSpacing: "0.02em",
          background: "linear-gradient(90deg, #FF2D78, #06B6D4)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          filter: "drop-shadow(0 0 30px rgba(255,45,120,0.6))",
        }}
      >
        PulseMap
      </div>

      <div style={{ textAlign: "center", lineHeight: 0.9 }}>
        <div style={{ fontSize: 180, transform: `scale(${line1})`, color: "#FFF" }}>
          OUVRE.
        </div>
        <div
          style={{
            fontSize: 180,
            transform: `scale(${line2})`,
            color: "#FF2D78",
            textShadow: "6px 6px 0 #000",
          }}
        >
          SORS.
        </div>
      </div>

      <div
        style={{
          transform: `scale(${cta * pulse})`,
          opacity: cta,
          padding: "34px 70px",
          background: "#FF2D78",
          color: "#000",
          fontSize: 76,
          border: "6px solid #FFF",
          boxShadow: `0 0 ${60 * pulse}px rgba(255,45,120,0.8)`,
          letterSpacing: "0.05em",
        }}
      >
        LIEN EN BIO ↓
      </div>

      <div
        style={{
          fontFamily: FONT_INTER,
          fontSize: 34,
          fontWeight: 900,
          color: "#FFF",
          opacity: cta,
          transform: `translateY(${arrow}px)`,
          letterSpacing: "0.2em",
        }}
      >
        PULSEMAP.LIVE
      </div>
    </AbsoluteFill>
  );
};
