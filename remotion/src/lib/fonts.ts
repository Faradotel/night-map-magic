import { loadFont } from "@remotion/google-fonts/Anton";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const anton = loadFont("normal", { weights: ["400"], subsets: ["latin"] });
const inter = loadInter("normal", { weights: ["400", "700"], subsets: ["latin"] });

export const FONT_ANTON = anton.fontFamily;
export const FONT_INTER = inter.fontFamily;
