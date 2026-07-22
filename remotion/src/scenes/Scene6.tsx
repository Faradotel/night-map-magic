import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { FONT_ANTON, FONT_INTER } from "../lib/fonts";

const CITIES = ["PARIS", "LYON", "MARSEILLE", "BORDEAUX", "TOULOUSE", "NANTES", "LILLE", "NICE", "MONTPELLIER", "STRASBOURG", "RENNES", "GRENOBLE"];

export const Scene6 = () => {
  const frame = useCurrentFrame();
  const scroll = interpolate(frame, [0, 48], [0, -1200]);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: FONT_ANTON,
      }}
    >
      <div style={{ fontFamily: FONT_INTER, fontSize: 42, fontWeight: 900, color: "#888", textAlign: "center", letterSpacing: "0.3em", marginBottom: 30 }}>
        PARTOUT EN FRANCE
      </div>
      <div style={{ transform: `translateY(${scroll}px)` }}>
        {CITIES.map((c, i) => {
          const highlight = Math.floor((frame / 4) % CITIES.length) === i;
          return (
            <div
              key={i}
              style={{
                fontSize: 160,
                lineHeight: 1,
                textAlign: "center",
                color: highlight ? "#FF2D78" : "#FFF",
                textShadow: highlight ? "0 0 40px #FF2D78" : "none",
                transform: highlight ? "scale(1.08)" : "scale(1)",
              }}
            >
              {c}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
