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
          bg: "#0c0e1a",
          card: "#141628",
          "card-hover": "#1a1c34",
          border: "#1e2040",
          "border-light": "#2a2d55",
        },
      },
      fontFamily: {
        rajdhani: ["Rajdhani", "sans-serif"],
      },
      boxShadow: {
        "glow-blue": "0 0 15px rgba(59, 130, 246, 0.5)",
        "glow-gold": "0 0 15px rgba(255, 215, 0, 0.5)",
        "glow-bronze": "0 0 15px rgba(205, 127, 50, 0.4)",
        "glow-silver": "0 0 12px rgba(200, 208, 224, 0.3)",
        "glow-green": "0 0 15px rgba(104, 211, 145, 0.5)",
        "glow-purple": "0 0 15px rgba(183, 148, 244, 0.5)",
      },
      keyframes: {
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        slideInRight: "slideInRight 0.3s ease-out",
        fadeOut: "fadeOut 0.5s ease-in forwards",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
