import { AbsoluteFill, useCurrentFrame, spring, interpolate } from "remotion";
import { FONT_INTER } from "../lib/fonts";

type Msg = { from: "me" | "them"; text: string; at: number };
const MSGS: Msg[] = [
  { from: "them", text: "on fait quoi ce soir ?", at: 0 },
  { from: "me", text: "j'sais pas 🤷", at: 10 },
  { from: "them", text: "moi non plus 😭", at: 22 },
  { from: "me", text: "encore netflix ?", at: 34 },
];

export const Scene2 = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        padding: 80,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 30,
        fontFamily: FONT_INTER,
      }}
    >
      {MSGS.map((m, i) => {
        const s = spring({
          frame: frame - m.at,
          fps: 30,
          config: { damping: 12, stiffness: 220 },
        });
        const isMe = m.from === "me";
        return (
          <div
            key={i}
            style={{
              alignSelf: isMe ? "flex-end" : "flex-start",
              transform: `scale(${s}) translateY(${(1 - s) * 30}px)`,
              opacity: s,
              maxWidth: "80%",
              padding: "26px 40px",
              borderRadius: 40,
              background: isMe
                ? "linear-gradient(135deg, #FF2D78, #8B5CF6)"
                : "#2a2a2a",
              color: "#FFF",
              fontSize: 54,
              fontWeight: 700,
              boxShadow: isMe
                ? "0 10px 40px rgba(255,45,120,0.4)"
                : "0 10px 30px rgba(0,0,0,0.5)",
            }}
          >
            {m.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
