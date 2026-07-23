import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { FONT_ANTON } from "../lib/fonts";
import { Glitch } from "../components/Glitch";

export const Scene4 = () => {
  const frame = useCurrentFrame();
  const s1 = spring({ frame, fps: 30, config: { damping: 7, stiffness: 260 } });
  const s2 = spring({ frame: frame - 14, fps: 30, config: { damping: 9, stiffness: 220 } });
  const flash = frame < 6 ? 0.6 : 0;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_ANTON,
        gap: 40,
      }}
    >
      <AbsoluteFill style={{ backgroundColor: `rgba(255,255,255,${flash})` }} />
      <div
        style={{
          fontSize: 340,
          transform: `scale(${s1})`,
          lineHeight: 0.9,
        }}
      >
        <Glitch intensity={12}>ARRÊTE.</Glitch>
      </div>
      <div
        style={{
          fontSize: 130,
          color: "#06B6D4",
          transform: `scale(${s2}) skewX(-6deg)`,
          textAlign: "center",
          textShadow: "6px 6px 0 #000",
          lineHeight: 0.9,
        }}
      >
        OUVRE
        <br />
        <span style={{ color: "#FFF" }}>PULSEMAP.</span>
      </div>
    </AbsoluteFill>
  );
};
