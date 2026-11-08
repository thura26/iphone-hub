/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        ink: '#0B0B0C',
        surface: '#FFFFFF',
        bg: '#F6F6F4',
        border: '#E7E5E4',
        dark: {
          bg: '#0A0A0A',
          surface: '#151515',
          border: '#2A2A2A',
          text: '#FAFAFA',
        },
      },
      borderRadius: {
        card: '16px',
        pill: '9999px',
        btn: '12px',
      },
    },
  },
  plugins: [],
}
