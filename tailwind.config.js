/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      colors: {
        void: '#04060a',
        panel: '#0a0f18',
        neon: {
          DEFAULT: '#00e5ff',
          soft: '#38f0ff',
          amber: '#ffb020',
        },
      },
      boxShadow: {
        neon: '0 0 20px rgba(0,229,255,0.45), 0 0 60px rgba(0,229,255,0.15)',
        'neon-amber': '0 0 20px rgba(255,176,32,0.45), 0 0 60px rgba(255,176,32,0.15)',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateX(-110%)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateX(110%)', opacity: '0' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.85)', opacity: '0.7' },
          '80%, 100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        gridpan: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 40px' },
        },
      },
      animation: {
        scan: 'scan 3.2s ease-in-out infinite',
        pulseRing: 'pulseRing 2s cubic-bezier(0.2,0.7,0.3,1) infinite',
        floaty: 'floaty 6s ease-in-out infinite',
        gridpan: 'gridpan 8s linear infinite',
      },
    },
  },
  plugins: [],
};
