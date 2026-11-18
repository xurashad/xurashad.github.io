"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { useKitsuneEnabled } from "@/lib/kitsuneState";

const KitsuneCompanion = dynamic(
  () => import("./KitsuneCompanion").then((m) => m.KitsuneCompanion),
  { ssr: false }
);

const emptySubscribe = () => () => {};

export function KitsuneLoader() {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [enabled] = useKitsuneEnabled();

  if (!mounted || !enabled) return null;

  return <KitsuneCompanion />;
}
