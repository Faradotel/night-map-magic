import {
  AbsoluteFill,
  Series,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONT_ANTON, FONT_INTER } from "../lib/fonts";
import type { AdScript, Beat } from "./scripts";

const BG = "#08080D";
const ACCENTS = {
  pink: "#FF2D78",
  cyan: "#22D3EE",
  lime: "#B6FF3C",
} as const;

type Accent = keyof typeof ACCENTS;

/* ---------------- persistent layers ---------------- */

const Backdrop: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame * 0.025) * 14;
  const pulse = 0.18 + Math.sin(frame * 0.12) * 0.05;
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at ${52 + drift}% 22%, ${accent}${Math.round(
            pulse * 255
          )
            .toString(16)
            .padStart(2, "0")}, transparent 58%), radial-gradient(ellipse at ${
            46 - drift
          }% 84%, rgba(255,255,255,0.07), transparent 60%)`,
        }}
      />
      {/* grille façon carte */}
      <AbsoluteFill
        style={{
          opacity: 0.09,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          transform: `translateY(${(frame * 0.6) % 120}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

const Pins: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame();
  const pins = [
    { x: 12, y: 16, d: 0 },
    { x: 84, y: 26, d: 11 },
    { x: 22, y: 78, d: 22 },
    { x: 78, y: 70, d: 7 },
    { x: 52, y: 92, d: 30 },
    { x: 8, y: 48, d: 17 },
  ];
  return (
    <AbsoluteFill>
      {pins.map((p, i) => {
        const t = (frame + p.d * 3) % 60;
        const ring = interpolate(t, [0, 45], [0, 1], { extrapolateRight: "clamp" });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: 18,
              height: 18,
              borderRadius: 999,
              background: accent,
              opacity: 0.75,
              transform: `translate(-50%,-50%) translateY(${Math.sin((frame + p.d * 9) * 0.05) * 10}px)`,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 999,
                border: `3px solid ${accent}`,
                transform: `scale(${1 + ring * 4})`,
                opacity: 1 - ring,
              }}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Frame: React.FC<{ accent: string; label: string }> = ({ accent, label }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ padding: 46, pointerEvents: "none" }}>
      <div
        style={{
          flex: 1,
          border: "2px solid rgba(255,255,255,0.12)",
          borderRadius: 44,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 76,
          left: 82,
          fontFamily: FONT_INTER,
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: "0.34em",
          color: "rgba(255,255,255,0.55)",
        }}
      >
        PULSEMAP
      </div>
      <div
        style={{
          position: "absolute",
          top: 74,
          right: 82,
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontFamily: FONT_INTER,
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: "0.22em",
          color: accent,
        }}
      >
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            background: accent,
            opacity: 0.4 + Math.abs(Math.sin(frame * 0.16)) * 0.6,
          }}
        />
        {label}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- beats ---------------- */

const Wrap: React.FC<{ children: React.ReactNode; align?: "flex-start" | "center" }> = ({
  children,
  align = "flex-start",
}) => {
  const frame = useCurrentFrame();
  const float = Math.sin(frame * 0.045) * 8;
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: align,
        padding: "0 96px",
        transform: `translateY(${float}px)`,
      }}
    >
      <div style={{ width: "100%" }}>{children}</div>
    </AbsoluteFill>
  );
};

const Hook: React.FC<{ beat: Extract<Beat, { type: "hook" }>; accent: string }> = ({
  beat,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const size = beat.lines.some((l) => l.length > 9) ? 150 : 200;
  return (
    <Wrap>
      {beat.kicker && (
        <div
          style={{
            fontFamily: FONT_INTER,
            fontSize: 30,
            fontWeight: 900,
            letterSpacing: "0.36em",
            color: accent,
            marginBottom: 26,
            opacity: interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          {beat.kicker}
        </div>
      )}
      {beat.lines.map((line, i) => {
        const s = spring({ frame: frame - i * 7, fps, config: { damping: 13, stiffness: 190 } });
        const isAccent = beat.accentLine === i;
        return (
          <div
            key={i}
            style={{
              fontFamily: FONT_ANTON,
              fontSize: size,
              lineHeight: 0.92,
              color: isAccent ? accent : "#FFFFFF",
              letterSpacing: "-0.02em",
              opacity: s,
              transform: `translateX(${(1 - s) * -70}px) skewX(${(1 - s) * -8}deg)`,
              textShadow: isAccent ? `0 0 60px ${accent}66` : "none",
            }}
          >
            {line}
          </div>
        );
      })}
    </Wrap>
  );
};

const Lines: React.FC<{ beat: Extract<Beat, { type: "lines" }>; accent: string }> = ({
  beat,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Wrap>
      {beat.items.map((item, i) => {
        const at = i * 16;
        const s = spring({ frame: frame - at, fps, config: { damping: 15, stiffness: 170 } });
        const strike = interpolate(frame - at - 12, [0, 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              position: "relative",
              display: "inline-block",
              fontFamily: FONT_INTER,
              fontSize: 84,
              fontWeight: 900,
              color: "#FFFFFF",
              margin: "18px 0",
              opacity: s * (beat.strike ? 1 - strike * 0.45 : 1),
              transform: `translateY(${(1 - s) * 40}px)`,
            }}
          >
            {item}
            {beat.strike && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: "52%",
                  height: 9,
                  width: `${strike * 100}%`,
                  background: accent,
                  borderRadius: 8,
                }}
              />
            )}
          </div>
        );
      })}
    </Wrap>
  );
};

const Steps: React.FC<{ beat: Extract<Beat, { type: "steps" }>; accent: string }> = ({
  beat,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Wrap>
      {beat.items.map((item, i) => {
        const s = spring({ frame: frame - i * 18, fps, config: { damping: 14, stiffness: 160 } });
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 30,
              margin: "26px 0",
              opacity: s,
              transform: `translateX(${(1 - s) * 60}px)`,
            }}
          >
            <div
              style={{
                fontFamily: FONT_ANTON,
                fontSize: 96,
                color: accent,
                minWidth: 90,
              }}
            >
              {i + 1}
            </div>
            <div style={{ fontFamily: FONT_INTER, fontSize: 62, fontWeight: 800, color: "#FFF" }}>
              {item}
            </div>
          </div>
        );
      })}
    </Wrap>
  );
};

const Stat: React.FC<{ beat: Extract<Beat, { type: "stat" }>; accent: string }> = ({
  beat,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 12, stiffness: 140 } });
  const value = Math.round(interpolate(s, [0, 1], [0, beat.value]));
  return (
    <Wrap>
      <div
        style={{
          fontFamily: FONT_ANTON,
          fontSize: 300,
          lineHeight: 0.88,
          color: accent,
          transform: `scale(${0.7 + s * 0.3})`,
          textShadow: `0 0 90px ${accent}55`,
        }}
      >
        {value}
        {beat.suffix ?? ""}
      </div>
      <div
        style={{
          fontFamily: FONT_INTER,
          fontSize: 52,
          fontWeight: 900,
          letterSpacing: "0.12em",
          color: "#FFF",
          marginTop: 18,
          opacity: interpolate(frame, [14, 28], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        {beat.label}
      </div>
    </Wrap>
  );
};

const Chips: React.FC<{ beat: Extract<Beat, { type: "chips" }>; accent: string }> = ({
  beat,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Wrap>
      <div
        style={{
          fontFamily: FONT_INTER,
          fontSize: 32,
          fontWeight: 900,
          letterSpacing: "0.3em",
          color: accent,
          marginBottom: 34,
          opacity: interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        {beat.title}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 22 }}>
        {beat.items.map((item, i) => {
          const s = spring({ frame: frame - 6 - i * 7, fps, config: { damping: 11, stiffness: 220 } });
          return (
            <div
              key={item}
              style={{
                fontFamily: FONT_ANTON,
                fontSize: 74,
                color: i % 3 === 1 ? accent : "#FFF",
                border: `3px solid ${i % 3 === 1 ? accent : "rgba(255,255,255,0.25)"}`,
                borderRadius: 26,
                padding: "10px 30px",
                opacity: s,
                transform: `scale(${0.6 + s * 0.4}) rotate(${(1 - s) * (i % 2 ? 6 : -6)}deg)`,
              }}
            >
              {item}
            </div>
          );
        })}
      </div>
    </Wrap>
  );
};

const Cta: React.FC<{ beat: Extract<Beat, { type: "cta" }>; accent: string }> = ({
  beat,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 12, stiffness: 160 } });
  const s2 = spring({ frame: frame - 14, fps, config: { damping: 16 } });
  const pulse = 1 + Math.sin(frame * 0.18) * 0.02;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 90 }}>
      <div
        style={{
          fontFamily: FONT_ANTON,
          fontSize: 210,
          color: "#FFF",
          letterSpacing: "-0.02em",
          transform: `scale(${s * pulse})`,
          textAlign: "center",
          lineHeight: 0.9,
        }}
      >
        PULSE<span style={{ color: accent }}>MAP</span>
      </div>
      <div
        style={{
          marginTop: 34,
          fontFamily: FONT_INTER,
          fontSize: 58,
          fontWeight: 900,
          color: "#08080D",
          background: accent,
          padding: "18px 44px",
          borderRadius: 999,
          opacity: s2,
          transform: `translateY(${(1 - s2) * 34}px) scale(${pulse})`,
        }}
      >
        {beat.line}
      </div>
      <div
        style={{
          marginTop: 26,
          fontFamily: FONT_INTER,
          fontSize: 36,
          fontWeight: 700,
          letterSpacing: "0.2em",
          color: "rgba(255,255,255,0.6)",
          opacity: s2,
        }}
      >
        GRATUIT · SANS INSCRIPTION
      </div>
    </AbsoluteFill>
  );
};

const BeatView: React.FC<{ beat: Beat; accent: string }> = ({ beat, accent }) => {
  switch (beat.type) {
    case "hook":
      return <Hook beat={beat} accent={accent} />;
    case "lines":
      return <Lines beat={beat} accent={accent} />;
    case "steps":
      return <Steps beat={beat} accent={accent} />;
    case "stat":
      return <Stat beat={beat} accent={accent} />;
    case "chips":
      return <Chips beat={beat} accent={accent} />;
    case "cta":
      return <Cta beat={beat} accent={accent} />;
  }
};

/* ---------------- main ---------------- */

export const adDuration = (ad: AdScript) => ad.beats.reduce((n, b) => n + b.dur, 0);

export const AdVideo: React.FC<{ ad: AdScript }> = ({ ad }) => {
  const accent = ACCENTS[ad.accent as Accent];
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <Backdrop accent={accent} />
      <Pins accent={accent} />
      <Series>
        {ad.beats.map((beat, i) => (
          <Series.Sequence key={i} durationInFrames={beat.dur}>
            <BeatView beat={beat} accent={accent} />
          </Series.Sequence>
        ))}
      </Series>
      <Frame accent={accent} label="LIVE" />
    </AbsoluteFill>
  );
};
