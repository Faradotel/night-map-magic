import { AbsoluteFill, useCurrentFrame, interpolate, spring, Series } from "remotion";
import { FONT_ANTON, FONT_INTER } from "./lib/fonts";

const BG = "#0A0A0F";
const PINK = "#FF2D78";
const CYAN = "#06B6D4";

const Background = () => {
  const frame = useCurrentFrame();
  const shift = Math.sin(frame * 0.02) * 20;
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at ${50 + shift}% 30%, rgba(255,45,120,0.25), transparent 60%), radial-gradient(ellipse at ${50 - shift}% 80%, rgba(6,182,212,0.2), transparent 60%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// Scene 1 — hook question
const S1 = () => {
  const frame = useCurrentFrame();
  const s1 = spring({ frame, fps: 30, config: { damping: 14 } });
  const s2 = spring({ frame: frame - 18, fps: 30, config: { damping: 12 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 30, padding: 60 }}>
      <div style={{ fontFamily: FONT_INTER, fontSize: 40, fontWeight: 900, letterSpacing: "0.3em", color: "#888", opacity: s1 }}>
        CE SOIR
      </div>
      <div
        style={{
          fontFamily: FONT_ANTON,
          fontSize: 260,
          color: "#FFF",
          lineHeight: 0.9,
          textAlign: "center",
          transform: `scale(${s1})`,
        }}
      >
        TU FAIS
        <br />
        <span style={{ color: PINK }}>QUOI ?</span>
      </div>
      <div
        style={{
          fontFamily: FONT_INTER,
          fontSize: 44,
          color: "#FFF",
          opacity: s2,
          transform: `translateY(${(1 - s2) * 20}px)`,
        }}
      >
        🤔
      </div>
    </AbsoluteFill>
  );
};

// Scene 2 — problem
const S2 = () => {
  const frame = useCurrentFrame();
  const lines = [
    { t: "Insta ? vide.", at: 0 },
    { t: "Google ? nul.", at: 14 },
    { t: "Potes ? aucune idée.", at: 28 },
  ];
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: 80, gap: 40, fontFamily: FONT_INTER }}>
      {lines.map((l, i) => {
        const s = spring({ frame: frame - l.at, fps: 30, config: { damping: 14 } });
        return (
          <div
            key={i}
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: "#FFF",
              opacity: s,
              transform: `translateX(${(1 - s) * -80}px)`,
            }}
          >
            {l.t}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Scene 3 — solution reveal
const S3 = () => {
  const frame = useCurrentFrame();
  const logo = spring({ frame, fps: 30, config: { damping: 10, stiffness: 180 } });
  const sub = spring({ frame: frame - 20, fps: 30, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 40 }}>
      <div
        style={{
          fontFamily: FONT_ANTON,
          fontSize: 200,
          background: `linear-gradient(135deg, ${PINK}, ${CYAN})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          transform: `scale(${logo})`,
          filter: "drop-shadow(0 0 40px rgba(255,45,120,0.5))",
        }}
      >
        PulseMap
      </div>
      <div
        style={{
          fontFamily: FONT_INTER,
          fontSize: 46,
          fontWeight: 700,
          color: "#FFF",
          textAlign: "center",
          opacity: sub,
          maxWidth: 900,
          padding: "0 40px",
        }}
      >
        La carte de tout ce qui se passe
        <br />
        <span style={{ color: CYAN }}>autour de toi.</span>
      </div>
    </AbsoluteFill>
  );
};

// Scene 4 — map with pins
const S4 = () => {
  const frame = useCurrentFrame();
  const pins = [
    { x: 200, y: 500, d: 0, c: PINK },
    { x: 780, y: 620, d: 6, c: CYAN },
    { x: 400, y: 900, d: 12, c: PINK },
    { x: 820, y: 1050, d: 18, c: "#8B5CF6" },
    { x: 260, y: 1250, d: 24, c: CYAN },
    { x: 640, y: 1400, d: 30, c: PINK },
  ];
  const title = spring({ frame: frame - 8, fps: 30, config: { damping: 14 } });
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(6,182,212,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.15) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
      {pins.map((p, i) => {
        const s = spring({ frame: frame - p.d, fps: 30, config: { damping: 8, stiffness: 200 } });
        const pulse = 1 + Math.sin((frame - p.d) * 0.2) * 0.15;
        return (
          <div key={i}>
            <div
              style={{
                position: "absolute",
                left: p.x - 40,
                top: p.y - 40,
                width: 80,
                height: 80,
                borderRadius: "50%",
                border: `3px solid ${p.c}`,
                opacity: interpolate((frame - p.d) % 30, [0, 30], [0.8, 0]),
                transform: `scale(${1 + ((frame - p.d) % 30) / 15})`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: p.x - 25,
                top: p.y - 25,
                width: 50,
                height: 50,
                borderRadius: "50%",
                background: p.c,
                border: "4px solid #FFF",
                boxShadow: `0 0 30px ${p.c}`,
                transform: `scale(${s * pulse})`,
              }}
            />
          </div>
        );
      })}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 140, pointerEvents: "none" }}>
        <div
          style={{
            fontFamily: FONT_ANTON,
            fontSize: 130,
            color: "#FFF",
            background: BG,
            padding: "18px 40px",
            border: `4px solid ${PINK}`,
            transform: `scale(${title})`,
            textAlign: "center",
            lineHeight: 0.95,
          }}
        >
          SOIRÉES,
          <br />
          <span style={{ color: PINK }}>CONCERTS,</span>
          <br />
          FESTIVALS
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Scene 5 — CTA
const S5 = () => {
  const frame = useCurrentFrame();
  const t1 = spring({ frame, fps: 30, config: { damping: 12 } });
  const t2 = spring({ frame: frame - 14, fps: 30, config: { damping: 10, stiffness: 200 } });
  const pulse = 1 + Math.sin(frame * 0.35) * 0.05;
  const arrow = Math.sin(frame * 0.4) * 12;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 60 }}>
      <div
        style={{
          fontFamily: FONT_ANTON,
          fontSize: 220,
          color: "#FFF",
          textAlign: "center",
          lineHeight: 0.9,
          transform: `scale(${t1})`,
          textShadow: `6px 6px 0 ${PINK}`,
        }}
      >
        SORS
        <br />
        <span style={{ color: CYAN }}>CE SOIR.</span>
      </div>
      <div
        style={{
          fontFamily: FONT_INTER,
          fontSize: 56,
          fontWeight: 900,
          color: "#000",
          background: "#FFF",
          padding: "28px 60px",
          borderRadius: 20,
          transform: `scale(${t2 * pulse})`,
          boxShadow: `0 0 ${50 * pulse}px rgba(255,45,120,0.7)`,
        }}
      >
        pulse-map.live
      </div>
      <div
        style={{
          fontFamily: FONT_INTER,
          fontSize: 40,
          color: "#FFF",
          opacity: t2,
          transform: `translateY(${arrow}px)`,
          letterSpacing: "0.2em",
        }}
      >
        ↓ LIEN EN BIO ↓
      </div>
    </AbsoluteFill>
  );
};

export const MainVideo = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: BG, overflow: "hidden" }}>
      <Background />
      <Series>
        <Series.Sequence durationInFrames={60}><S1 /></Series.Sequence>
        <Series.Sequence durationInFrames={70}><S2 /></Series.Sequence>
        <Series.Sequence durationInFrames={70}><S3 /></Series.Sequence>
        <Series.Sequence durationInFrames={80}><S4 /></Series.Sequence>
        <Series.Sequence durationInFrames={90}><S5 /></Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
