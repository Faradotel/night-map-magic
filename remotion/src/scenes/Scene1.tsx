import { AbsoluteFill, useCurrentFrame, interpolate, spring } from "remotion";
import { FONT_ANTON } from "../lib/fonts";
import { Glitch } from "../components/Glitch";

export const Scene1 = () => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 36], [1.4, 1.05]);
  const pop = spring({ frame, fps: 30, config: { damping: 8, stiffness: 260 } });
  const skew = interpolate(frame, [0, 20], [-8, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_ANTON,
      }}
    >
      <div
        style={{
          transform: `scale(${pop * zoom}) skewX(${skew}deg)`,
          fontSize: 340,
          lineHeight: 0.9,
          textAlign: "center",
          fontWeight: 900,
        }}
      >
        <Glitch intensity={10}>STOP.</Glitch>
      </div>
    </AbsoluteFill>
  );
};
