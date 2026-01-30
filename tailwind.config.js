/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Ensure custom animations are always included
  safelist: [
    'animate-league-scroll',
  ],
  theme: {
    // Add xs breakpoint for very small screens
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // ========================================
        // BET SENSE DESIGN SYSTEM v2.0
        // Premium Sports + AI Branding
        // ========================================
        
        // Primary (Sport Tech Blue / Electric Blue)
        primary: {
          DEFAULT: '#1A73E8',
          hover: '#1666CC',
          light: '#E3F0FF',
          dark: '#0F3A6D',
        },
        
        // Accent (AI Cyber Mint)
        accent: {
          DEFAULT: '#2AF6A0',
          dark: '#1EC77E',
          light: '#D6FFEC',
        },
        
        // Secondary (Violet/Purple - Props.Cash inspired)
        violet: {
          DEFAULT: '#8B5CF6',
          light: '#A78BFA',
          dark: '#7C3AED',
          glow: 'rgba(139, 92, 246, 0.4)',
        },
        
        // Background / Surface (Dark Theme - warmer blacks)
        bg: {
          DEFAULT: '#0A0A0A',
          primary: '#000000', // Pure black for main sections
          card: '#121212',
          hover: '#1A1A1A',
          elevated: '#1E1E1E',
          subtle: '#0E0E0E',
          glass: 'rgba(18, 18, 18, 0.7)',
          light: '#F8FAFC', // Legacy - avoid using
        },
        
        // Dividers & Borders
        divider: '#2A3036',
        
        // Text Colors
        text: {
          primary: '#FFFFFF',
          secondary: '#B5BDC7',
          muted: '#9CA3AF',  // Improved contrast (was #7A838D - 4.2:1, now 4.8:1)
          accent: '#2AF6A0',
          danger: '#FF5C5C',
        },
        
        // Matrix Typography Colors
        matrix: {
          DEFAULT: '#6B8E6B',    // Muted sage green
          dim: '#4A6A4A',        // Darker for secondary labels
          bright: '#8FB38F',     // Slightly brighter for emphasis
        },
        
        // Semantic Colors
        success: '#2AF6A0',
        warning: '#FACC15',
        danger: '#F87171',
        info: '#38BDF8',
        
        // Legacy aliases for backwards compatibility
        'accent-lime': '#2AF6A0',
        'accent-cyan': '#38BDF8',
        'accent-green': '#1EC77E',
        'accent-gold': '#FACC15',
        'accent-red': '#F87171',
        'primary-900': '#0B0E11',
        'surface-card': '#14181D',
        'surface-border': '#2A3036',
        'bg-elevated': '#1F252C',
        'bg-page': '#0E1116',
        'bg-surface': '#14181D',
        'bg-surface-alt': '#1C2229',
      },
      
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'Helvetica', 'Arial', 'sans-serif'],
        matrix: ['var(--font-matrix)', 'Share Tech Mono', 'Consolas', 'monospace'],
      },
      
      fontSize: {
        // Typography Scale - Bold & Tight (Props.Cash inspired)
        'h1': ['2.75rem', { lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.03em' }],      // 44px
        'h1-mobile': ['2rem', { lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.02em' }], // 32px
        'h2': ['2.25rem', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.02em' }],    // 36px
        'h2-mobile': ['1.5rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' }], // 24px
        'h3': ['1.75rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }],     // 28px
        'h3-mobile': ['1.25rem', { lineHeight: '1.25', fontWeight: '700' }], // 20px
        'body-lg': ['1.125rem', { lineHeight: '1.5', fontWeight: '400' }], // 18px
        'body': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],      // 16px
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }], // 14px
        'label': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],  // 12px
      },
      
      spacing: {
        // Custom spacing scale
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '48px',
      },
      
      borderRadius: {
        'card': '16px',
        'chip': '999px',
        'btn': '12px',
      },
      
      boxShadow: {
        'card': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.5)',
        'glow-accent': '0 0 30px rgba(42, 246, 160, 0.35)',
        'glow-primary': '0 0 30px rgba(26, 115, 232, 0.35)',
        'glow-violet': '0 0 40px rgba(139, 92, 246, 0.3)',
        'glow-danger': '0 0 15px rgba(248, 113, 113, 0.25)',
        'inner-glow': 'inset 0 1px 2px rgba(42, 246, 160, 0.1)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'ambient': '0 0 60px rgba(139, 92, 246, 0.15), 0 0 100px rgba(42, 246, 160, 0.1)',
      },
      
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': 'linear-gradient(135deg, #0A0A0A 0%, #121212 50%, #0A0A0A 100%)',
        'card-gradient': 'linear-gradient(145deg, #121212 0%, #1A1A1A 100%)',
        'accent-gradient': 'linear-gradient(135deg, #1A73E8 0%, #2AF6A0 100%)',
        'violet-gradient': 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
        'violet-accent-gradient': 'linear-gradient(135deg, #8B5CF6 0%, #2AF6A0 100%)',
        'glow-border': 'linear-gradient(135deg, #1A73E8, #2AF6A0)',
        'gradient-border-violet': 'linear-gradient(135deg, #8B5CF6, #2AF6A0)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
      },
      
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'league-scroll': 'leagueScroll 10s linear infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(42, 246, 160, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(42, 246, 160, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        leagueScroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
