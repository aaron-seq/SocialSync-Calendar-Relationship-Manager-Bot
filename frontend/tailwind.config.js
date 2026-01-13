/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ============================================
      // "Nocturnal Glass" Color Palette
      // ============================================
      colors: {
        // Background
        'void-slate': '#0F172A',
        'glass-layer': '#1E293B',
        
        // Text
        'starlight': '#F8FAFC',
        'moon-dust': '#94A3B8',
        
        // Accents
        'neon-violet': '#A78BFA',
        'cyber-emerald': '#34D399',
        'toxic-rose': '#FB7185',
        'solar-amber': '#FBBF24',
        
        // Extended Palette
        nexus: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#1e1b4b',
        },
      },
      
      // ============================================
      // Custom Fonts
      // ============================================
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      
      // ============================================
      // Glass & Blur Effects
      // ============================================
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
        '3xl': '64px',
      },
      
      // ============================================
      // Animation & Transitions
      // ============================================
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'orbit': 'orbit 100s linear infinite',
        'drift': 'drift 3s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'glitch': 'glitch 0.3s ease-in-out',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(167, 139, 250, 0.3)'
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(167, 139, 250, 0.6)'
          },
        },
        'orbit': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'drift': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'glitch': {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        },
      },
      
      // ============================================
      // Gradient Backgrounds
      // ============================================
      backgroundImage: {
        'gradient-void': 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(30, 41, 59, 0.6) 100%)',
        'gradient-neon': 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
        'gradient-health': 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
        'gradient-danger': 'linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)',
      },
      
      // ============================================
      // Box Shadows (Glass Effects)
      // ============================================
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'glass-lg': '0 8px 40px rgba(0, 0, 0, 0.15)',
        'neon-violet': '0 0 20px rgba(167, 139, 250, 0.4)',
        'neon-emerald': '0 0 20px rgba(52, 211, 153, 0.4)',
        'neon-rose': '0 0 20px rgba(251, 113, 133, 0.4)',
      },
      
      // ============================================
      // Border Radius
      // ============================================
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
}
