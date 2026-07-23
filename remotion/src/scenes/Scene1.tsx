import { AbsoluteFill, useCurrentFrame, interpolate, spring } from "remotion";
import { FONT_ANTON, FONT_INTER } from "../lib/fonts";

export const Scene1 = () => {
  const frame = useCurrentFrame();
  // Clock ticks 22:00 -> 22:03
  const mins = Math.floor(frame / 12) % 4;
  const colon = frame % 20 < 10 ? ":" : " ";
  const label = spring({ frame: frame - 6, fps: 30, config: { damping: 12 } });
  const pop = spring({ frame: frame - 20, fps: 30, config: { damping: 8, stiffness: 260 } });
  const shake = Math.sin(frame * 0.9) * 4;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
        fontFamily: FONT_ANTON,
      }}
    >
      <div
        style={{
          fontFamily: FONT_INTER,
          fontSize: 34,
          fontWeight: 900,
          letterSpacing: "0.4em",
          color: "#888",
          opacity: label,
        }}
      >
        VENDREDI SOIR
      </div>
      <div
        style={{
          fontSize: 420,
          lineHeight: 0.9,
          color: "#FFF",
          textShadow: "0 0 60px rgba(255,45,120,0.6)",
          transform: `translateX(${shake}px)`,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        22{colon}0{mins}
      </div>
      <div
        style={{
          transform: `scale(${pop})`,
          fontSize: 130,
          color: "#FF2D78",
          textShadow: "5px 5px 0 #000",
        }}
      >
        OÙ ALLER ?
      </div>
    </AbsoluteFill>
  );
};
