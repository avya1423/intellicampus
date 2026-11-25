import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563eb",
          foreground: "#ffffff",
        },
        surface: "#ffffff",
        canvas: "#f8fafc",
      },
    },
  },
  plugins: [],
} satisfies Config;
