export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors:{
        dark_bg: "#00150f",
        light_bg: "#f0fdf4",
        primary: "#10b981",
        secondary: "#047857",
        accent: "#065f46",
        text_primary: "#ffffff",
        text_secondary: "#d1fae5",
        text_accent: "#6ee7b7",
      },
      boxShadow: {
        custom: "0 4px 6px -1px #00150f, 0 2px 4px -1px #00150f",
      },
      animation: {
        'spin-slow': 'spin 1s linear infinite 500ms',
      },
    } ,
  },
  plugins: [],
}
