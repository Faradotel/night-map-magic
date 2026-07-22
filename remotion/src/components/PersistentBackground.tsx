import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

const FLOATERS = [
  { size: 300, x: -80, y: 200, color: "#FF2D78", speed: 0.02 },
  { size: 220, x: 750, y: 600, color: "#8B5CF6", speed: 0.015 },
  { size: 180, x: 100, y: 1300, color: "#06B6D4", speed: 0.025 },
  { size: 260, x: 700, y: 1600, color: "#FF2D78", speed: 0.018 },
];

export const PersistentBackground = () => {
  const frame = useCurrentFrame();

  const gradientShift = interpolate(frame, [0, 540], [0, 360], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientShift}deg, #0A0A0A 0%, #1a0b1a 50%, #0A0A0A 100%)`,
      }}
    >
      {FLOATERS.map((f, i) => {
        const offset = Math.sin(frame * f.speed + i) * 40;
        const offsetY = Math.cos(frame * f.speed * 0.7 + i) * 30;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: f.x + offset,
              top: f.y + offsetY,
              width: f.size,
              height: f.size,
              borderRadius: i % 2 === 0 ? "50%" : "20%",
              background: f.color,
              opacity: 0.08,
              filter: "blur(60px)",
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
    </AbsoluteFill>
  );
};
