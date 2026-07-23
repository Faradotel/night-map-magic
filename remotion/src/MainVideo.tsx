import { AbsoluteFill, Series, useCurrentFrame, random } from "remotion";
import { PersistentBackground } from "./components/PersistentBackground";
import { Scene1 } from "./scenes/Scene1";
import { Scene2 } from "./scenes/Scene2";
import { Scene3 } from "./scenes/Scene3";
import { Scene4 } from "./scenes/Scene4";
import { Scene5 } from "./scenes/Scene5";
import { Scene6 } from "./scenes/Scene6";
import { Scene7 } from "./scenes/Scene7";
import { Scene8 } from "./scenes/Scene8";

const Shake = ({ children }: { children: React.ReactNode }) => {
  const frame = useCurrentFrame();
  const x = (random(`sx${frame}`) - 0.5) * 6;
  const y = (random(`sy${frame}`) - 0.5) * 6;
  return (
    <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px)` }}>
      {children}
    </AbsoluteFill>
  );
};

const Grain = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        mixBlendMode: "overlay",
        opacity: 0.15,
        backgroundImage: `radial-gradient(circle at ${
          20 + (frame % 7) * 10
        }% ${30 + (frame % 5) * 12}%, rgba(255,255,255,0.4) 0.5px, transparent 1px)`,
        backgroundSize: "3px 3px",
      }}
    />
  );
};

export const MainVideo = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#050505", overflow: "hidden" }}>
      <PersistentBackground />
      <Shake>
        <Series>
          <Series.Sequence durationInFrames={50}>
            <Scene1 />
          </Series.Sequence>
          <Series.Sequence durationInFrames={56}>
            <Scene2 />
          </Series.Sequence>
          <Series.Sequence durationInFrames={48}>
            <Scene3 />
          </Series.Sequence>
          <Series.Sequence durationInFrames={40}>
            <Scene4 />
          </Series.Sequence>
          <Series.Sequence durationInFrames={60}>
            <Scene5 />
          </Series.Sequence>
          <Series.Sequence durationInFrames={54}>
            <Scene6 />
          </Series.Sequence>
          <Series.Sequence durationInFrames={36}>
            <Scene7 />
          </Series.Sequence>
          <Series.Sequence durationInFrames={78}>
            <Scene8 />
          </Series.Sequence>
        </Series>
      </Shake>
      <Grain />
    </AbsoluteFill>
  );
};
