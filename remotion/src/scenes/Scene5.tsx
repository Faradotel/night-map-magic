import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { FONT_ANTON, FONT_INTER } from "../lib/fonts";

const PINS = [
  { x: 200, y: 500, color: "#FF2D78", d: 0 },
  { x: 780, y: 620, color: "#06B6D4", d: 6 },
  { x: 420, y: 780, color: "#8B5CF6", d: 12 },
  { x: 660, y: 980, color: "#FF2D78", d: 18 },
  { x: 260, y: 1080, color: "#06B6D4", d: 24 },
  { x: 820, y: 1240, color: "#8B5CF6", d: 30 },
];

export const Scene5 = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {/* Grid map background */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.15) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          transform: `perspective(800px) rotateX(35deg) translateY(-100px) scale(${interpolate(
            frame,
            [0, 40],
            [1.4, 1.1]
          )})`,
          opacity: 0.9,
        }}
      />
      {PINS.map((p, i) => {
        const s = spring({
          frame: frame - p.d,
          fps: 30,
          config: { damping: 8, stiffness: 220 },
        });
        const bounce = Math.sin(frame * 0.25 + i) * 6;
        const ring = interpolate(frame - p.d, [0, 40], [0, 3], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const ringOp = interpolate(frame - p.d, [0, 40], [0.8, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y + bounce,
              transform: `scale(${s})`,
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 80,
                height: 80,
                left: -20,
                top: -20,
                borderRadius: "50%",
                border: `4px solid ${p.color}`,
                transform: `scale(${ring})`,
                opacity: ringOp,
              }}
            />
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: p.color,
                boxShadow: `0 0 30px ${p.color}, 0 0 60px ${p.color}`,
                border: "4px solid #fff",
              }}
            />
          </div>
        );
      })}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          padding: 60,
        }}
      >
        <div
          style={{
            fontFamily: FONT_ANTON,
            fontSize: 140,
            color: "#FFF",
            textAlign: "center",
            lineHeight: 0.9,
            textShadow: "6px 6px 0 #FF2D78",
          }}
        >
          UNE CARTE.
          <br />
          <span style={{ color: "#06B6D4" }}>TOUT LE GAME.</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
