import type { Config } from "tailwindcss";

/** Colours are CSS variables (RGB channels) so light, dark and "system" themes share one class set. */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;
const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      colors: {
        bg: token("bg"),
        surface: { DEFAULT: token("surface"), 2: token("surface-2"), 3: token("surface-3") },
        line: { DEFAULT: token("line"), strong: token("line-strong") },
        fg: { DEFAULT: token("fg"), muted: token("fg-muted"), subtle: token("fg-subtle") },
        accent: { DEFAULT: token("accent"), hover: token("accent-hover"), soft: token("accent-soft"), text: token("accent-text") },
        success: { DEFAULT: token("success"), soft: token("success-soft"), text: token("success-text") },
        warning: { DEFAULT: token("warning"), soft: token("warning-soft"), text: token("warning-text") },
        danger: { DEFAULT: token("danger"), soft: token("danger-soft"), text: token("danger-text") },
      },
      boxShadow: {
        card: "0 1px 2px rgb(var(--shadow) / 0.04), 0 1px 3px rgb(var(--shadow) / 0.05)",
        "card-hover": "0 12px 32px -12px rgb(var(--shadow) / 0.18), 0 2px 6px rgb(var(--shadow) / 0.05)",
        pop: "0 20px 50px -12px rgb(var(--shadow) / 0.28), 0 4px 12px rgb(var(--shadow) / 0.08)",
        "inner-hi": "inset 0 1px 0 rgb(255 255 255 / 0.14)",
      },
      transitionTimingFunction: { out: ease, spring: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
      keyframes: {
        shake: { "0%,100%": { transform: "translateX(0)" }, "25%": { transform: "translateX(-6px)" }, "75%": { transform: "translateX(6px)" } },
        fadeUp: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        rise: { from: { opacity: "0", transform: "translateY(10px) scale(0.985)" }, to: { opacity: "1", transform: "none" } },
        page: { from: { opacity: "0", transform: "translateY(6px)", filter: "blur(3px)" }, to: { opacity: "1", transform: "none", filter: "none" } },
        shimmer: { from: { backgroundPosition: "-200% 0" }, to: { backgroundPosition: "200% 0" } },
        draw: { from: { transform: "scaleY(0)" }, to: { transform: "scaleY(1)" } },
        aurora: {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)" },
          "33%": { transform: "translate3d(6%,-8%,0) scale(1.08)" },
          "66%": { transform: "translate3d(-5%,6%,0) scale(0.96)" },
        },
        progress: { from: { transform: "scaleX(1)" }, to: { transform: "scaleX(0)" } },
        pop: { "0%": { transform: "scale(0.6)", opacity: "0" }, "60%": { transform: "scale(1.15)", opacity: "1" }, "100%": { transform: "scale(1)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-4px)" } },
        "scan-line": { "0%": { transform: "translateY(-120%)" }, "100%": { transform: "translateY(120%)" } },
      },
      animation: {
        shake: "shake 0.3s ease-in-out 2",
        fadeUp: `fadeUp 0.35s ${ease} both`,
        rise: `rise 0.55s ${ease} both`,
        page: `page 0.45s ${ease} both`,
        shimmer: "shimmer 1.6s linear infinite",
        draw: `draw 0.9s ${ease} both`,
        aurora: "aurora 18s ease-in-out infinite",
        "aurora-slow": "aurora 26s ease-in-out infinite reverse",
        pop: "pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        float: "float 4s ease-in-out infinite",
        "scan-line": "scan-line 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
