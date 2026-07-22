import { AbsoluteFill, useCurrentFrame, interpolate, random } from "remotion";

export const PersistentBackground = () => {
  const frame = useCurrentFrame();
  const hue = interpolate(frame, [0, 390], [300, 480]);
  const flash = frame % 42 < 2 ? 0.15 : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#050505" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 30% 20%, hsla(${hue}, 90%, 45%, 0.35), transparent 55%), radial-gradient(ellipse at 70% 80%, hsla(${
            hue + 60
          }, 90%, 50%, 0.3), transparent 55%)`,
        }}
      />
      {/* scanlines */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 4px)",
          pointerEvents: "none",
        }}
      />
      {/* flash */}
      <AbsoluteFill style={{ backgroundColor: `rgba(255,255,255,${flash})` }} />
      {/* speckle */}
      {Array.from({ length: 25 }).map((_, i) => {
        const x = random(`x${i}`) * 1080;
        const y = random(`y${i}`) * 1920;
        const drift = Math.sin(frame * 0.05 + i) * 20;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + drift,
              top: y,
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: i % 3 === 0 ? "#FF2D78" : i % 3 === 1 ? "#06B6D4" : "#8B5CF6",
              boxShadow: "0 0 12px currentColor",
              opacity: 0.7,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
