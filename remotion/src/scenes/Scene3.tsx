import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { FONT_ANTON } from "../lib/fonts";

const ROTATIONS = [
  { text: "INSTA ?", color: "#FFF" },
  { text: "STORIES VIDES.", color: "#888" },
  { text: "SNAP ?", color: "#FFF" },
  { text: "PERSONNE.", color: "#888" },
  { text: "GOOGLE ?", color: "#FFF" },
  { text: "3 RESTOS FERMÉS.", color: "#888" },
];

export const Scene3 = () => {
  const frame = useCurrentFrame();
  const idx = Math.floor(frame / 8) % ROTATIONS.length;
  const cur = ROTATIONS[idx];
  const localFrame = frame % 8;
  const scale = interpolate(localFrame, [0, 3, 8], [1.3, 1, 0.95]);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_ANTON,
        gap: 30,
      }}
    >
      <div
        style={{
          fontSize: 180,
          color: cur.color,
          transform: `scale(${scale}) rotate(${
            (idx % 2 === 0 ? -1 : 1) * 3
          }deg)`,
          textAlign: "center",
          textShadow: cur.color === "#FFF" ? "6px 6px 0 #FF2D78" : "none",
          padding: "0 40px",
          lineHeight: 0.9,
        }}
      >
        {cur.text}
      </div>
    </AbsoluteFill>
  );
};
