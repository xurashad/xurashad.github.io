import type { Metadata } from "next";
import EarthExplorer from "./EarthExplorer";

export const metadata: Metadata = {
  title: "Earth Explorer --- Interactive 3D Globe",
  description:
    "Explore Earth in stunning 3D with satellite imagery, location search, fly-to animations, day/night lighting, and bookmarked landmarks. Powered by CesiumJS and OpenStreetMap --- a Google Earth-like experience entirely in your browser.",
  keywords: [
    "3D globe",
    "earth explorer",
    "interactive map",
    "CesiumJS",
    "OpenStreetMap",
    "satellite imagery",
    "geography",
    "Google Earth alternative",
  ],
};

export default function EarthExplorerPage() {
  return <EarthExplorer />;
}

