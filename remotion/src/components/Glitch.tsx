import React from "react";

export const Glitch = ({
  children,
  intensity = 6,
}: {
  children: React.ReactNode;
  intensity?: number;
}) => {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          color: "#FF2D78",
          transform: `translate(${intensity}px, 0)`,
          mixBlendMode: "screen",
          opacity: 0.85,
        }}
      >
        {children}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          color: "#06B6D4",
          transform: `translate(-${intensity}px, 0)`,
          mixBlendMode: "screen",
          opacity: 0.85,
        }}
      >
        {children}
      </div>
      <div style={{ position: "relative", color: "#FFFFFF" }}>{children}</div>
    </div>
  );
};
