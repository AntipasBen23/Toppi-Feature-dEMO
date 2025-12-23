import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b0d10",
        panel: "rgba(255,255,255,0.06)",
        border: "rgba(255,255,255,0.10)",
        text: "rgba(255,255,255,0.92)",
        muted: "rgba(255,255,255,0.68)",
        muted2: "rgba(255,255,255,0.52)",
        accent: "#f5a524", // warm amber (Toppi-ish)
      },
      boxShadow: {
        panel: "0 10px 30px rgba(0,0,0,0.45)",
      },
      borderRadius: {
        xl2: "18px",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
