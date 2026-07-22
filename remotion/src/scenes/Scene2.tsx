import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";

export const Scene2 = () => {
  const frame = useCurrentFrame();

  const mainScale = spring({
    frame: frame - 5,
    fps: 30,
    config: { damping: 14, stiffness: 180 },
  });

  const subOpacity = spring({
    frame: frame - 35,
    fps: 30,
    config: { damping: 20, stiffness: 150 },
  });

  const qm1 = spring({ frame: frame - 50, fps: 30, config: { damping: 10 } });
  const qm2 = spring({ frame: frame - 60, fps: 30, config: { damping: 10 } });
  const qm3 = spring({ frame: frame - 70, fps: 30, config: { damping: 10 } });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Anton', sans-serif",
        color: "#FFFFFF",
      }}
    >
      <div
        style={{
          transform: `scale(${mainScale})`,
          fontSize: 130,
          lineHeight: 1.1,
          textAlign: "center",
          color: "#8B5CF6",
          textShadow: "0 0 50px rgba(139,92,246,0.5)",
        }}
      >
        MAIS T'ES
        <br />
        PAS INSPIRÉ
      </div>
      <div
        style={{
          opacity: subOpacity,
          marginTop: 50,
          fontFamily: "'Inter', sans-serif",
          fontSize: 42,
          fontWeight: 400,
          color: "#CCCCCC",
        }}
      >
        WhatsApp mort. Plans flous. Rien à faire.
      </div>

      <div
        style={{
          position: "absolute",
          left: 120,
          top: 280,
          fontSize: 120,
          color: "#FF2D78",
          transform: `scale(${qm1}) rotate(-15deg)`,
          opacity: qm1,
        }}
      >
        ?
      </div>
      <div
        style={{
          position: "absolute",
          right: 140,
          top: 380,
          fontSize: 100,
          color: "#06B6D4",
          transform: `scale(${qm2}) rotate(20deg)`,
          opacity: qm2,
        }}
      >
        ?
      </div>
      <div
        style={{
          position: "absolute",
          left: 180,
          bottom: 320,
          fontSize: 90,
          color: "#8B5CF6",
          transform: `scale(${qm3}) rotate(-10deg)`,
          opacity: qm3,
        }}
      >
        ?
      </div>
    </AbsoluteFill>
  );
};
