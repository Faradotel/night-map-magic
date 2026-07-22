import { AbsoluteFill, useCurrentFrame, spring } from "remotion";
import { FONT_ANTON } from "../lib/fonts";
import { Glitch } from "../components/Glitch";

export const Scene7 = () => {
  const frame = useCurrentFrame();
  const s = spring({ frame, fps: 30, config: { damping: 7, stiffness: 260 } });
  const s2 = spring({ frame: frame - 10, fps: 30, config: { damping: 7, stiffness: 260 } });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_ANTON,
        gap: 20,
      }}
    >
      <div
        style={{
          fontSize: 280,
          transform: `scale(${s}) rotate(${(1 - s) * -20}deg)`,
          lineHeight: 0.9,
        }}
      >
        <Glitch intensity={14}>GRATUIT.</Glitch>
      </div>
      <div
        style={{
          fontSize: 200,
          transform: `scale(${s2})`,
          color: "#06B6D4",
          textShadow: "6px 6px 0 #000",
          lineHeight: 0.9,
        }}
      >
        SANS COMPTE.
      </div>
    </AbsoluteFill>
  );
};
