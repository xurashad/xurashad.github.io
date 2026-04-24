import type { Metadata } from "next";
import ExternalAppViewer from "../_external/ExternalAppViewer";

export const metadata: Metadata = {
  title: "Stellarium — Web Planetarium | Rashad Hamidi",
  description:
    "Stellarium is a free open-source planetarium. It renders a realistic sky in 3D, just like what you see with your naked eye, binoculars or a telescope. Created by the Stellarium team.",
  keywords: ["Stellarium", "planetarium", "astronomy", "sky", "stars", "constellations", "open source"],
};

export default function StellariumPage() {
  return (
    <ExternalAppViewer
      src="https://stellarium-web.org/"
      title="Stellarium"
      description="Open-source planetarium showing a realistic 3D sky. Explore stars, constellations, planets, and deep-sky objects."
      projectUrl="https://stellarium.org/"
      projectName="Stellarium Team"
      tags={["Astronomy", "Planetarium", "Sky", "Open Source", "Constellations"]}
    />
  );
}
