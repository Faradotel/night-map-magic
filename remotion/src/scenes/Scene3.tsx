import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { FONT_ANTON, FONT_INTER } from "../lib/fonts";

export const Scene3 = () => {
  const frame = useCurrentFrame();

  const logoScale = spring({
    frame: frame - 10,
    fps: 30,
    config: { damping: 12, stiffness: 150 },
  });

  const pinScale = spring({
    frame: frame - 40,
    fps: 30,
    config: { damping: 10, stiffness: 200 },
  });

  const ringScale = interpolate(frame, [40, 120], [0, 2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ringOpacity = interpolate(frame, [40, 120], [0.8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tagOpacity = spring({
    frame: frame - 70,
    fps: 30,
    config: { damping: 20, stiffness: 150 },
  });

  const pulse = 1 + Math.sin(frame * 0.3) * 0.05;

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
          transform: `scale(${logoScale})`,
          fontSize: 140,
          color: "#FFFFFF",
          textShadow: "0 0 60px rgba(255,45,120,0.4)",
          letterSpacing: "0.02em",
        }}
      >
        PulseMap
      </div>

      <div
        style={{
          position: "relative",
          width: 140,
          height: 140,
          marginTop: 60,
          transform: `scale(${pinScale * pulse})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "4px solid #FF2D78",
            transform: `scale(${ringScale})`,
            opacity: ringOpacity,
          }}
        />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          style={{ width: "100%", height: "100%" }}
        >
          <path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
            fill="#FF2D78"
          />
          <circle cx="12" cy="9" r="2.5" fill="#FFFFFF" />
        </svg>
      </div>

      <div
        style={{
          opacity: tagOpacity,
          marginTop: 60,
          fontFamily: FONT_INTER,
          fontSize: 44,
          fontWeight: 700,
          color: "#06B6D4",
          letterSpacing: "0.05em",
        }}
      >
        La carte des soirées
      </div>
    </AbsoluteFill>
  );
};
