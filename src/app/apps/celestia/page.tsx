import type { Metadata } from "next";
import ExternalAppViewer from "../_external/ExternalAppViewer";

export const metadata: Metadata = {
  title: "Celestia — 3D Space Simulation | Rashad Hamidi",
  description:
    "Explore the universe in real-time 3D. Celestia is a free space simulation that lets you travel through an extensive universe, at any speed, in any direction, at any time. Created by Celestia Development Team.",
  keywords: ["Celestia", "space simulation", "astronomy", "3D", "universe", "stars", "planets"],
};

export default function CelestiaPage() {
  return (
    <ExternalAppViewer
      src="https://celestia.mobi/web"
      title="Celestia"
      description="Real-time 3D space simulation. Explore the universe from any point in space and time."
      projectUrl="https://celestiaproject.space/"
      projectName="Celestia Development Team"
      tags={["Astronomy", "3D", "Simulation", "Space", "Open Source"]}
    />
  );
}
