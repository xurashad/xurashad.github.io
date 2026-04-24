import type { Metadata } from "next";
import BuilderClient from "./BuilderClient";

export const metadata: Metadata = {
  title: "Website Builder Pro | Rashad Hamidi",
  description:
    "Create stunning, responsive websites visually with drag-and-drop sections, rich text editing, multi-page support, theme customization, asset management, and one-click ZIP export. No coding required.",
  keywords: [
    "website builder",
    "drag and drop",
    "WYSIWYG",
    "web design",
    "no-code",
    "site builder",
    "responsive design",
    "export",
  ],
};

export default function WebBuilderPage() {
  return <BuilderClient />;
}
