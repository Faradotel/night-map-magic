import { AbsoluteFill, useCurrentFrame, spring } from "remotion";
import { FONT_ANTON, FONT_INTER } from "../lib/fonts";

const TAGS = [
  { label: "TECHNO", color: "#FF2D78", delay: 0 },
  { label: "RAP", color: "#8B5CF6", delay: 8 },
  { label: "AFTERWORK", color: "#06B6D4", delay: 16 },
  { label: "RAVE", color: "#FF2D78", delay: 24 },
  { label: "FESTIVAL", color: "#8B5CF6", delay: 32 },
  { label: "HOUSE", color: "#06B6D4", delay: 40 },
];

export const Scene4 = () => {
  const frame = useCurrentFrame();

  const countScale = spring({
    frame: frame - 60,
    fps: 30,
    config: { damping: 12, stiffness: 120 },
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_ANTON,
        color: "#FFFFFF",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 24,
          maxWidth: 900,
          padding: "0 60px",
        }}
      >
        {TAGS.map((tag, i) => {
          const s = spring({
            frame: frame - tag.delay,
            fps: 30,
            config: { damping: 14, stiffness: 200 },
          });
          return (
            <div
              key={i}
              style={{
                transform: `scale(${s})`,
                opacity: s,
                padding: "22px 44px",
                borderRadius: 16,
                backgroundColor: `${tag.color}22`,
                border: `3px solid ${tag.color}`,
                color: tag.color,
                fontSize: 52,
                letterSpacing: "0.05em",
                boxShadow: `0 0 30px ${tag.color}40`,
              }}
            >
              {tag.label}
            </div>
          );
        })}
      </div>

      <div
        style={{
          transform: `scale(${countScale})`,
          opacity: countScale,
          marginTop: 80,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 160,
            color: "#FF2D78",
            textShadow: "0 0 60px rgba(255,45,120,0.5)",
          }}
        >
          5000+
        </div>
        <div
          style={{
            fontFamily: FONT_INTER,
            fontSize: 48,
            fontWeight: 700,
            color: "#FFFFFF",
            marginTop: 10,
          }}
        >
          soirées près de chez toi
        </div>
      </div>
    </AbsoluteFill>
  );
};
