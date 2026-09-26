/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        accent: {
          pink: "var(--accent-pink)",
          light: "var(--accent-light)",
        },
        bg: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          tertiary: "var(--bg-tertiary)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        border: "var(--border-color)",
      },
      spacing: {
        '128': '32rem',
      },
      borderRadius: {
        lg: "var(--border-radius-lg)",
        md: "var(--border-radius-md)",
        sm: "var(--border-radius-sm)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        '2xl': "var(--shadow-2xl)",
      },
      keyframes: {
        'meesho-scroll': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'meesho-scroll': 'meesho-scroll 25s linear infinite',
      },
    },
  },
  plugins: [],
}
