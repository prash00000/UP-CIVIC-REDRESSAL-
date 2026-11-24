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
        bg: "#FFFFFF",
        surface: "#F8FAFC",
        border: "#E2E8F0",
        text: "#0F172A",
        muted: "#475569",
        primary: {
          DEFAULT: "#1D4ED8",
          hover: "#1E40AF",
        },
        accent: "#F59E0B",
        success: "#15803D",
        warning: "#B45309",
        danger: "#B91C1C",
      },
      borderRadius: {
        card: "12px",
        btn: "10px",
      },
      maxWidth: {
        content: "1040px",
        form: "720px",
      },
      fontSize: {
        bodyMobile: ["17px", { lineHeight: "1.5" }],
        bodyDesktop: ["18px", { lineHeight: "1.5" }],
        label: ["15px", { lineHeight: "1.4" }],
      },
      minHeight: {
        btn: "48px",
        touch: "44px",
      },
    },
  },
  plugins: [],
};

export default config;
