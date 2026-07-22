import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { FONT_ANTON, FONT_INTER } from "../lib/fonts";

export const Scene5 = () => {
  const frame = useCurrentFrame();

  const line1 = spring({
    frame: frame - 10,
    fps: 30,
    config: { damping: 14, stiffness: 180 },
  });

  const line2 = spring({
    frame: frame - 40,
    fps: 30,
    config: { damping: 14, stiffness: 180 },
  });

  const ctaScale = spring({
    frame: frame - 70,
    fps: 30,
    config: { damping: 10, stiffness: 200 },
  });

  const glow = interpolate(frame, [70, 120], [0.3, 0.8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pulse = 1 + Math.sin(frame * 0.25) * 0.06;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_ANTON,
        color: "#FFFFFF",
      }}
    >
      <div
        style={{
          transform: `scale(${line1})`,
          opacity: line1,
          fontSize: 120,
          textAlign: "center",
          lineHeight: 1.1,
          color: "#FFFFFF",
        }}
      >
        TROUVE
        <br />
        TON PLAN
      </div>

      <div
        style={{
          transform: `scale(${line2})`,
          opacity: line2,
          marginTop: 30,
          fontSize: 90,
          color: "#06B6D4",
          textShadow: "0 0 50px rgba(6,182,212,0.5)",
        }}
      >
        MAINTENANT.
      </div>

      <div
        style={{
          transform: `scale(${ctaScale * pulse})`,
          opacity: ctaScale,
          marginTop: 100,
          padding: "36px 80px",
          borderRadius: 24,
          backgroundColor: "#FF2D78",
          color: "#FFFFFF",
          fontSize: 70,
          letterSpacing: "0.05em",
          boxShadow: `0 0 ${80 * glow}px rgba(255,45,120,${glow})`,
        }}
      >
        LIEN EN BIO
      </div>

      <div
        style={{
          opacity: ctaScale,
          marginTop: 50,
          fontFamily: FONT_INTER,
          fontSize: 36,
          color: "#888888",
        }}
      >
        PulseMap — Toutes les soirées, sur une carte.
      </div>
    </AbsoluteFill>
  );
};
