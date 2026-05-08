import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        game: {
          bg:             "#111111",
          card:           "#1C1C1C",
          "card-hover":   "#242424",
          border:         "#2A2A2A",
          "border-light": "#383838",
        },
        fi: {
          orange:         "#FF5500",
          "orange-hover": "#FF6B1A",
          "orange-dim":   "rgba(255,85,0,0.12)",
        },
      },
      fontFamily: {
        rajdhani: ["Rajdhani", "sans-serif"],
      },
      boxShadow: {
        "glow-orange": "0 0 14px rgba(255,85,0,0.5)",
        "glow-green":  "0 0 12px rgba(28,228,0,0.4)",
        "glow-blue":   "0 0 12px rgba(93,199,229,0.4)",
        "glow-purple": "0 0 12px rgba(174,0,252,0.4)",
        "glow-gold":   "0 0 12px rgba(255,215,0,0.5)",
        "glow-bronze": "0 0 10px rgba(205,127,50,0.4)",
        "glow-silver": "0 0 10px rgba(200,208,224,0.3)",
      },
      keyframes: {
        slideInRight: {
          "0%":   { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)",    opacity: "1" },
        },
        fadeOut: {
          "0%":   { opacity: "1" },
          "100%": { opacity: "0" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0"  },
        },
      },
      animation: {
        slideInRight: "slideInRight 0.3s ease-out",
        fadeOut:      "fadeOut 0.5s ease-in forwards",
        shimmer:      "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
