import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";

export const Scene1 = () => {
  const frame = useCurrentFrame();

  const titleScale = spring({
    frame,
    fps: 30,
    config: { damping: 12, stiffness: 200 },
  });

  const subtitleOpacity = spring({
    frame: frame - 20,
    fps: 30,
    config: { damping: 20, stiffness: 150 },
  });

  const float = Math.sin(frame * 0.08) * 10;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Anton', sans-serif",
        color: "#FFFFFF",
      }}
    >
      <div
        style={{
          transform: `scale(${titleScale}) translateY(${float}px)`,
          fontSize: 220,
          lineHeight: 1,
          textAlign: "center",
          textShadow: "0 0 60px rgba(255,45,120,0.5)",
        }}
      >
        CE SOIR ?
      </div>
      <div
        style={{
          opacity: subtitleOpacity,
          marginTop: 40,
          fontFamily: "'Inter', sans-serif",
          fontSize: 48,
          fontWeight: 700,
          color: "#FF2D78",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        Tu veux sortir...
      </div>
    </AbsoluteFill>
  );
};
