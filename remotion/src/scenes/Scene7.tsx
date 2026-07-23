import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { FONT_ANTON } from "../lib/fonts";

const TAGS = ["TECHNO", "RAP", "HOUSE", "AFTER", "CONCERT", "FESTIVAL"];

export const Scene7 = () => {
  const frame = useCurrentFrame();
  const scroll = interpolate(frame, [0, 36], [1080, -1200]);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        fontFamily: FONT_ANTON,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 40,
          transform: `translateX(${scroll}px)`,
          whiteSpace: "nowrap",
        }}
      >
        {[...TAGS, ...TAGS].map((t, i) => (
          <div
            key={i}
            style={{
              fontSize: 200,
              color: i % 2 === 0 ? "#FFF" : "#FF2D78",
              WebkitTextStroke: i % 2 === 0 ? "0" : "3px #FFF",
              textShadow: "6px 6px 0 #000",
            }}
          >
            {t}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
