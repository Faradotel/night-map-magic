import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { AdVideo, adDuration } from "./ads/AdVideo";
import { ADS } from "./ads/scripts";

export const RemotionRoot = () => (
  <>
    <Composition
      id="main"
      component={MainVideo}
      durationInFrames={370}
      fps={30}
      width={1080}
      height={1920}
    />
    {ADS.map((ad) => (
      <Composition
        key={ad.id}
        id={ad.id}
        component={AdVideo}
        durationInFrames={adDuration(ad)}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ ad }}
      />
    ))}
  </>
);
