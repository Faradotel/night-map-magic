import { AbsoluteFill, useCurrentFrame, spring, interpolate, random } from "remotion";
import { FONT_ANTON, FONT_INTER } from "../lib/fonts";

const PINS = Array.from({ length: 10 }).map((_, i) => ({
  x: random(`px${i}`) * 900 + 80,
  y: random(`py${i}`) * 1300 + 400,
  d: 4 + i * 3,
  color: ["#FF2D78", "#06B6D4", "#8B5CF6"][i % 3],
  size: 30 + random(`ps${i}`) * 24,
}));

export const Scene5 = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {/* map grid */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(6,182,212,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.18) 1px, transparent 1px)",
          backgroundSize: "70px 70px",
          transform: `scale(${interpolate(frame, [0, 40], [1.4, 1.05])})`,
        }}
      />
      {/* radar sweep around user */}
      {[0, 1, 2].map((r) => {
        const t = (frame - r * 12) % 40;
        const scale = interpolate(t, [0, 40], [0.3, 3.5], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const op = interpolate(t, [0, 40], [0.8, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={r}
            style={{
              position: "absolute",
              left: 540 - 100,
              top: 960 - 100,
              width: 200,
              height: 200,
              borderRadius: "50%",
              border: "4px solid #FF2D78",
              transform: `scale(${scale})`,
              opacity: op,
            }}
          />
        );
      })}
      {/* user dot */}
      <div
        style={{
          position: "absolute",
          left: 540 - 30,
          top: 960 - 30,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "#FF2D78",
          border: "6px solid #FFF",
          boxShadow: "0 0 40px #FF2D78",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 540 + 50,
          top: 960 - 20,
          fontFamily: FONT_INTER,
          fontSize: 34,
          fontWeight: 900,
          color: "#FFF",
          background: "#000",
          padding: "6px 16px",
          border: "2px solid #FF2D78",
        }}
      >
        TOI
      </div>

      {PINS.map((p, i) => {
        const s = spring({
          frame: frame - p.d,
          fps: 30,
          config: { damping: 8, stiffness: 220 },
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: p.color,
              border: "4px solid #FFF",
              boxShadow: `0 0 25px ${p.color}`,
              transform: `scale(${s})`,
            }}
          />
        );
      })}

      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: 120,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: FONT_ANTON,
            fontSize: 110,
            color: "#FFF",
            background: "#000",
            padding: "12px 30px",
            border: "5px solid #06B6D4",
            transform: "skewX(-6deg)",
            textAlign: "center",
            lineHeight: 0.95,
          }}
        >
          TOUT
          <br />
          <span style={{ color: "#06B6D4" }}>AUTOUR DE TOI</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
