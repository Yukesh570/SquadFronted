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
        // --- PRIMARY INTERACTIVE PALETTE (Dynamic) ---
        'primary': 'var(--color-primary)',           
        'primary-dark': 'var(--color-primary-dark)', 
        'primary-light': 'var(--color-primary-light)', 

        // ... (keep accent, secondary, text colors same as before) ...
        'accent': '#10B981',
        'accent-dark': '#059669',
        'secondary': '#f7f7f8',
        'text-primary': '#212529',
        'text-secondary': '#6c757d',

        // --- SIDEBAR ACTIVE/HOVER COLORS (FIXED) ---
        // Active BG: Uses the light variant we calculate
        'sidebar-active-bg': 'var(--color-primary-light)', 
        
        // Active Text: Uses the base primary color (Dark Purple)
        'sidebar-active-text': 'var(--color-primary)',
      },
      // ... keep existing boxShadow, borderRadius etc. ...
      boxShadow: {
        'card': '0 4px 12px 0 rgba(0, 0, 0, 0.07)', 
        'input': '0 1px 3px 0 rgba(0, 0, 0, 0.05)', 
      },
      borderRadius: {
        'xl': '0.75rem', 
      },
    },
  },
  plugins: [],
};