"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { useKitsuneEnabled } from "@/lib/kitsuneState";

const KitsuneCompanion = dynamic(
  () => import("./KitsuneCompanion").then((m) => m.KitsuneCompanion),
  { ssr: false }
);

const emptySubscribe = () => () => {};

export function KitsuneLoader() {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const pathname = usePathname();
  const [enabled] = useKitsuneEnabled();

  if (
    !mounted ||
    !enabled ||
    pathname?.includes("/website-builder/editor") ||
    pathname?.includes("/wetex/editor")
  )
    return null;

  return <KitsuneCompanion />;
}
