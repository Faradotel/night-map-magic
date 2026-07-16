import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchEvents from "./tools/search-events";
import getEvent from "./tools/get-event";
import tonightHotspots from "./tools/tonight-hotspots";
import listFavorites from "./tools/list-favorites";
import addFavorite from "./tools/add-favorite";
import markAttendance from "./tools/mark-attendance";
import myProfile from "./tools/my-profile";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "pulsemap-mcp",
  title: "PulseMap",
  version: "0.1.0",
  instructions:
    "Outils PulseMap : rechercher soirées, concerts, festivals, brocantes et sorties en France ; consulter les spots chauds de la soirée ; gérer favoris, participations et profil de l'utilisateur connecté. Toujours répondre en français.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchEvents, getEvent, tonightHotspots, listFavorites, addFavorite, markAttendance, myProfile],
});
