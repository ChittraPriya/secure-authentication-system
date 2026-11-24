"use client";

import { createContext, useContext } from "react";

export type Theme = "light" | "dark" | "system";

export type Viewer = {
  firstName: string;
  surname: string;
  fullName: string;
  initials: string;
  contact: string; // masked
};

export type ShellState = {
  viewer: Viewer;
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (t: Theme, origin?: { x: number; y: number }) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (v: boolean) => void;
  openCommand: () => void;
  logout: () => Promise<void>;
};

export const ShellContext = createContext<ShellState | null>(null);

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside <Shell>");
  return ctx;
}
