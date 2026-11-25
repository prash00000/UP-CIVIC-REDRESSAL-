import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-background-body, #F7F6F2)",
        surface: "var(--color-background-surface, #FFFFFF)",
        mutedSurface: "var(--color-background-muted, #EFECE6)",
        border: "var(--color-border, #D8D4CA)",
        borderStrong: "var(--color-border-emphasized, #A8A295)",
        text: "var(--color-text-primary, #161B22)",
        muted: "var(--color-text-secondary, #4A515B)",
        primary: {
          DEFAULT: "var(--color-accent, #154273)",
          hover: "#0F3156",
        },
        terracotta: "#C84B16",
        accent: "#C84B16",
        success: "var(--color-success, #245937)",
        warning: "var(--color-warning, #8A5300)",
        danger: "var(--color-error, #A31C1C)",
      },
      fontFamily: {
        sans: [
          "Inter",
          '"Noto Sans Devanagari"',
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        serif: [
          '"Source Serif 4"',
          '"Noto Serif Devanagari"',
          "Georgia",
          "serif",
        ],
      },
      borderRadius: {
        card: "6px",
        btn: "4px",
      },
      maxWidth: {
        content: "1120px",
        form: "720px",
      },
      fontSize: {
        bodyMobile: ["17px", { lineHeight: "1.5" }],
        bodyDesktop: ["18px", { lineHeight: "1.5" }],
        label: ["14px", { lineHeight: "1.4" }],
      },
      minHeight: {
        btn: "46px",
        touch: "44px",
      },
    },
  },
  plugins: [],
};

export default config;
