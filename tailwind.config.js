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
        // --- PRIMARY INTERACTIVE PALETTE (Purple) ---
        'primary': '#7F58D8',        // Base Purple: Main color for buttons, links, and focus states.
        'primary-dark': '#6A49BC',   // Darker Purple: Used for hover and active states of primary buttons.
        // ------------------------------------------

        // --- ACCENT/STATUS PALETTE (Green) ---
        'accent': '#10B981',         // Accent Green: For success messages, indicators, and badges.
        'accent-dark': '#059669',    // Darker Green: Accent hover states.
        // -------------------------------------

        // --- BASE & TEXT COLORS ---
        'secondary': '#f7f7f8',      // Background: Light gray color for the main content areas.
        'text-primary': '#212529',   // Text: High-contrast, near-black color for titles and main body text.
        'text-secondary': '#6c757d', // Text: Lighter gray for labels, placeholders, and supporting text.
        // --------------------------

        // --- SIDEBAR ACTIVE/HOVER COLORS ---
        'sidebar-active-bg': '#EDE9FE', // Active BG: Very light purple background for the selected menu item.
        'sidebar-active-text': '#7F58D8', // Active Text: Uses the Base Primary Purple for the active link's text/icon color.
        // -----------------------------------
      },
      boxShadow: {
        'card': '0 4px 12px 0 rgba(0, 0, 0, 0.07)', // Lifted shadow for cards and modals.
        'input': '0 1px 3px 0 rgba(0, 0, 0, 0.05)', // Subtle shadow for form input fields.
      },
      borderRadius: {
        'xl': '0.75rem', // Consistent 12px border radius.
      },
      transform: ['active'],
    },
  },
  plugins: [],
};