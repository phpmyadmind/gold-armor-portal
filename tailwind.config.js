/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'castle-blue': '#1A4B9F',
        'castle-blue-light': '#153E82',
        'sky-blue': '#66C2E0',
        'gold-orange': '#e2ad42',
        'gold-orange-light': '#FFA500',
        // Paleta de colores adicional
        'light-blue': '#b7dae1',
        'dark-blue': '#183e90',
        'orange': '#d97d20',
        'turquoise': '#77bbd7',
        'purple': '#59529c',
      },
      fontFamily: {
        'castle': ['DenkOne', 'Arial', 'sans-serif'],
        'sans': ['DenkOne', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

