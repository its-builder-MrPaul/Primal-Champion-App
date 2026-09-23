module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: { extend: {
    colors: {
      background: "#07080B", surface: "#12151C", border: "#242A36",
      text: "#F5F7FA", muted: "#8C95A6", accent: "#E4572E",
      success: "#2ED47A", warning: "#F2B443", danger: "#E5484D"
    },
    borderRadius: { card: "20px", control: "14px" }
  }},
  plugins: []
};