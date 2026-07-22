import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { FONT_ANTON, FONT_INTER } from "../lib/fonts";

export const Scene3 = () => {
  const frame = useCurrentFrame();
  const bar = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const textIn = spring({ frame: frame - 10, fps: 30, config: { damping: 12 } });
  const numIn = spring({ frame: frame - 22, fps: 30, config: { damping: 8, stiffness: 220 } });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_ANTON,
        color: "#FFF",
        gap: 30,
      }}
    >
      <div
        style={{
          height: 12,
          width: `${bar * 90}%`,
          background: "linear-gradient(90deg, #FF2D78, #8B5CF6, #06B6D4)",
          boxShadow: "0 0 30px #FF2D78",
        }}
      />
      <div
        style={{
          fontFamily: FONT_INTER,
          fontSize: 40,
          fontWeight: 700,
          opacity: textIn,
          letterSpacing: "0.3em",
          color: "#888",
        }}
      >
        AUTOUR DE TOI
      </div>
      <div
        style={{
          fontSize: 380,
          lineHeight: 0.85,
          transform: `scale(${numIn})`,
          background: "linear-gradient(180deg, #FF2D78, #8B5CF6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          filter: "drop-shadow(0 0 40px rgba(255,45,120,0.6))",
        }}
      >
        5000+
      </div>
      <div
        style={{
          fontFamily: FONT_INTER,
          fontSize: 44,
          fontWeight: 900,
          opacity: textIn,
          textTransform: "uppercase",
        }}
      >
        Soirées. Live. Maintenant.
      </div>
    </AbsoluteFill>
  );
};
