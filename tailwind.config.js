/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  colors: {
    'sidebar-active-bg': '#E5E7EB', // new hover background
    'sidebar-active-text': '#1F2937', // new hover text
  },
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  extend: {
      colors: {
        'primary': '#4F46E5',        // The main blue/indigo from app buttons
        'primary-dark': '#4338CA',   // A darker shade for hover
        'accent': '#10B981',         // The green from the map pin/app icon
        'accent-dark': '#059669',    // A darker green for hover
        'secondary': '#f7f7f8',      // The light gray content background
        'text-primary': '#212529',   // The main dark text color
        'text-secondary': '#6c757d', // The lighter, secondary text color
        'sidebar-active-bg': '#EEF2FF', // A very light blue/indigo
        'sidebar-active-text': '#4F46E5', // The main blue/indigo text
      },
      boxShadow: {
        'card': '0 4px 12px 0 rgba(0, 0, 0, 0.07)',
        'input': '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'xl': '0.75rem',
      },
      transform: ['active'],
    },
  },
  plugins: [],
};