import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { FONT_ANTON, FONT_INTER } from "../lib/fonts";

const STATS = [
  { n: "12", label: "SOIRÉES À -2 KM" },
  { n: "37", label: "CE WEEK-END" },
  { n: "0€", label: "SANS COMPTE" },
];

export const Scene6 = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 60,
        padding: 40,
      }}
    >
      {STATS.map((st, i) => {
        const s = spring({
          frame: frame - i * 8,
          fps: 30,
          config: { damping: 9, stiffness: 220 },
        });
        const dir = i % 2 === 0 ? -1 : 1;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 30,
              transform: `translateX(${(1 - s) * 300 * dir}px)`,
              opacity: s,
            }}
          >
            <div
              style={{
                fontFamily: FONT_ANTON,
                fontSize: 260,
                lineHeight: 0.9,
                background: "linear-gradient(180deg, #FF2D78, #8B5CF6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 25px rgba(255,45,120,0.5))",
              }}
            >
              {st.n}
            </div>
            <div
              style={{
                fontFamily: FONT_INTER,
                fontSize: 40,
                fontWeight: 900,
                color: "#FFF",
                maxWidth: 400,
                lineHeight: 1,
                textTransform: "uppercase",
              }}
            >
              {st.label}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
