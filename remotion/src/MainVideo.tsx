import { AbsoluteFill, Series } from "remotion";
import { loadFont } from "@remotion/google-fonts/Anton";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { PersistentBackground } from "./components/PersistentBackground";
import { Scene1 } from "./scenes/Scene1";
import { Scene2 } from "./scenes/Scene2";
import { Scene3 } from "./scenes/Scene3";
import { Scene4 } from "./scenes/Scene4";
import { Scene5 } from "./scenes/Scene5";

loadFont("normal", { weights: ["400"], subsets: ["latin"] });
loadInter("normal", { weights: ["400", "700"], subsets: ["latin"] });

export const MainVideo = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0A0A0A", overflow: "hidden" }}>
      <PersistentBackground />
      <Series>
        <Series.Sequence durationInFrames={90}>
          <Scene1 />
        </Series.Sequence>
        <Series.Sequence durationInFrames={90}>
          <Scene2 />
        </Series.Sequence>
        <Series.Sequence durationInFrames={120}>
          <Scene3 />
        </Series.Sequence>
        <Series.Sequence durationInFrames={120}>
          <Scene4 />
        </Series.Sequence>
        <Series.Sequence durationInFrames={120}>
          <Scene5 />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
