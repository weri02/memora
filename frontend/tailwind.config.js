/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#fdfbf7",
        pencil: "#2d2d2d",
        muted: "#e5e0d8",
        accent: "#ff4d4d",
        "accent-blue": "#2d5da1",
      },
      fontFamily: {
        heading: ["Kalam", "cursive"],
        body: ["Patrick Hand", "cursive"],
      },
      borderRadius: {
        wobbly: "255px 15px 225px 15px / 15px 225px 15px 255px",
        "wobbly-md": "15px 255px 15px 225px / 225px 15px 255px 15px",
      },
      boxShadow: {
        hand: "4px 4px 0px 0px #2d2d2d",
        "hand-lg": "8px 8px 0px 0px #2d2d2d",
        "hand-sm": "2px 2px 0px 0px #2d2d2d",
        "hand-card": "3px 3px 0px 0px rgba(45, 45, 45, 0.1)",
      },
    },
  },
  plugins: [],
};
