"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "azurite-kitsune-enabled";
const EVENT_NAME = "azurite-kitsune-change";

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onChange = () => callback();
  window.addEventListener(EVENT_NAME, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT_NAME, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

function getServerSnapshot(): boolean {
  return true;
}

export function setKitsuneEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
  } catch {
    // ignore storage errors
  }
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function toggleKitsuneGlobal(): void {
  setKitsuneEnabled(!getSnapshot());
}

export function useKitsuneEnabled(): [boolean, () => void, (val: boolean) => void] {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    setKitsuneEnabled(!getSnapshot());
  }, []);

  const setEnabled = useCallback((val: boolean) => {
    setKitsuneEnabled(val);
  }, []);

  return [enabled, toggle, setEnabled];
}
