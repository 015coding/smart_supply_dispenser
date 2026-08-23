import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16343a",
        teal: "#1d7774",
        mint: "#e9f5f1",
        sand: "#f7faf8"
      },
      boxShadow: {
        soft: "0 16px 45px rgba(22, 52, 58, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
