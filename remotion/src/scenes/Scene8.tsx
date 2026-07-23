import { AbsoluteFill, useCurrentFrame, spring } from "remotion";
import { FONT_ANTON, FONT_INTER } from "../lib/fonts";

export const Scene8 = () => {
  const frame = useCurrentFrame();
  const logo = spring({ frame, fps: 30, config: { damping: 11, stiffness: 200 } });
  const line = spring({ frame: frame - 12, fps: 30, config: { damping: 10, stiffness: 200 } });
  const cta = spring({ frame: frame - 26, fps: 30, config: { damping: 8, stiffness: 220 } });
  const pulse = 1 + Math.sin(frame * 0.4) * 0.06;
  const arrow = Math.sin(frame * 0.45) * 14;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 45,
        fontFamily: FONT_ANTON,
      }}
    >
      <div
        style={{
          transform: `scale(${logo})`,
          fontSize: 150,
          background: "linear-gradient(90deg, #FF2D78, #06B6D4)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          filter: "drop-shadow(0 0 30px rgba(255,45,120,0.6))",
        }}
      >
        PulseMap
      </div>

      <div
        style={{
          fontSize: 170,
          transform: `scale(${line})`,
          color: "#FFF",
          textAlign: "center",
          lineHeight: 0.9,
          textShadow: "6px 6px 0 #FF2D78",
        }}
      >
        SORS
        <br />
        <span style={{ color: "#06B6D4" }}>CE SOIR.</span>
      </div>

      <div
        style={{
          transform: `scale(${cta * pulse})`,
          opacity: cta,
          padding: "34px 70px",
          background: "#FF2D78",
          color: "#000",
          fontSize: 72,
          border: "6px solid #FFF",
          boxShadow: `0 0 ${60 * pulse}px rgba(255,45,120,0.8)`,
        }}
      >
        LIEN EN BIO ↓
      </div>

      <div
        style={{
          fontFamily: FONT_INTER,
          fontSize: 36,
          fontWeight: 900,
          color: "#FFF",
          opacity: cta,
          transform: `translateY(${arrow}px)`,
          letterSpacing: "0.25em",
        }}
      >
        PULSEMAP.LIVE
      </div>
    </AbsoluteFill>
  );
};
