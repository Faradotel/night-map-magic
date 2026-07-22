import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { FONT_ANTON } from "../lib/fonts";

const WORDS = ["T'AS", "RIEN", "À", "FOUTRE", "CE SOIR ?"];

export const Scene2 = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        fontFamily: FONT_ANTON,
        padding: 60,
      }}
    >
      {WORDS.map((w, i) => {
        const s = spring({
          frame: frame - i * 5,
          fps: 30,
          config: { damping: 9, stiffness: 240 },
        });
        const rot = interpolate(s, [0, 1], [-15, i % 2 === 0 ? -2 : 3]);
        const colors = ["#FFFFFF", "#FF2D78", "#FFFFFF", "#06B6D4", "#FFFFFF"];
        return (
          <div
            key={i}
            style={{
              transform: `scale(${s}) rotate(${rot}deg)`,
              opacity: s,
              fontSize: i === 4 ? 150 : 180,
              lineHeight: 0.9,
              color: colors[i],
              textShadow: `4px 4px 0 ${colors[i] === "#FFFFFF" ? "#FF2D78" : "#000"}`,
              alignSelf: i % 2 === 0 ? "flex-start" : "flex-end",
            }}
          >
            {w}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
