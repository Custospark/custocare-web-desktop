import type { Config } from 'tailwindcss'

const config: Config = {
  // For @tailwindcss/vite, use 'content' instead of 'content' 
  // The plugin automatically handles content detection in Vite projects
content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}',
],

  theme: {
    extend: {
      colors: {
        // Primary Colors (Trust & Professionalism)
        primary: {
          DEFAULT: '#1E3A8A',
          hover: '#1E40AF',
          light: '#DBEAFE',
        },
        
        // Accent Colors (Health & Success)
        success: {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
        },
        
        // Alert Colors (Clinical Safety)
        critical: {
          DEFAULT: '#EF4444',
          dark: '#DC2626',
          light: '#FEE2E2',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
        },
        
        // Neutral Colors (Readability & Structure)
        neutral: {
          black: '#111827',
          'gray-dark': '#374151',
          'gray-medium': '#6B7280',
          'gray-light': '#D1D5DB',
          'gray-bg': '#F3F4F6',
          white: '#FFFFFF',
        },
        
        // Specialty Colors (Module-Specific)
        specialty: {
          lab: '#3B82F6',
          pharmacy: '#8B5CF6',
          triage: '#F97316',
        },
      },
      
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      
      fontSize: {
        // Headings
        'h1': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'h2': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'h3': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'h4': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        
        // Body
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        
        // Specialized
        'patient-name': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'patient-id': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'allergy-warning': ['16px', { lineHeight: '24px', fontWeight: '700' }],
        'critical-value': ['20px', { lineHeight: '28px', fontWeight: '700' }],
      },
      
      spacing: {
        '4': '4px',
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '24': '24px',
        '32': '32px',
        '48': '48px',
      },
      
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      
      boxShadow: {
        'card': '0px 1px 3px rgba(0, 0, 0, 0.1)',
        'card-hover': '0px 4px 6px rgba(0, 0, 0, 0.1)',
        'modal': '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-in',
      },
    },
  },
  plugins: [],
}

export default config