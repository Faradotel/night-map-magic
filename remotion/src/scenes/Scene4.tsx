import { AbsoluteFill, useCurrentFrame, spring, interpolate, random } from "remotion";
import { FONT_ANTON } from "../lib/fonts";

const TAGS = [
  "TECHNO", "RAP", "HOUSE", "AFTER", "RAVE", "FEST",
  "DRUM", "BASS", "R&B", "ROCK", "JAZZ", "ÉLECTRO",
];
const COLORS = ["#FF2D78", "#8B5CF6", "#06B6D4"];

export const Scene4 = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {TAGS.map((t, i) => {
        const delay = i * 3;
        const s = spring({
          frame: frame - delay,
          fps: 30,
          config: { damping: 10, stiffness: 200 },
        });
        const x = random(`x${i}`) * 780 + 40;
        const y = random(`y${i}`) * 1600 + 160;
        const rot = (random(`r${i}`) - 0.5) * 40;
        const color = COLORS[i % 3];
        const size = 60 + random(`sz${i}`) * 50;
        const wobble = Math.sin(frame * 0.15 + i) * 6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y + wobble,
              transform: `scale(${s}) rotate(${rot}deg)`,
              opacity: s,
              fontFamily: FONT_ANTON,
              fontSize: size,
              color,
              textShadow: `3px 3px 0 #000, 0 0 30px ${color}`,
              WebkitTextStroke: `2px ${color}`,
              padding: "8px 20px",
              border: `4px solid ${color}`,
              background: "rgba(0,0,0,0.55)",
              letterSpacing: "0.05em",
            }}
          >
            #{t}
          </div>
        );
      })}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          paddingBottom: 80,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: FONT_ANTON,
            fontSize: 90,
            color: "#FFF",
            background: "#000",
            padding: "10px 30px",
            transform: `skewX(-8deg) scale(${interpolate(frame, [20, 40], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })})`,
            border: "4px solid #FF2D78",
          }}
        >
          TOUS LES SONS
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
