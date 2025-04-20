import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'
import aspectRatio from '@tailwindcss/aspect-ratio'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'insta-blue': '#3897f0',
        'insta-red': '#ed4956',
        'insta-grey': '#8e8e8e',
        'insta-light-grey': '#fafafa',
        'insta-dark-grey': '#262626',
        'insta-gradient-start': '#feda75',
        'insta-gradient-middle': '#fa7e1e',
        'insta-gradient-end': '#d62976',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      animation: {
        'heart-burst': 'heart-burst 0.45s cubic-bezier(0.17, 0.89, 0.32, 1.49)',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        'heart-burst': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    forms,
    typography,
    aspectRatio,
  ],
} satisfies Config
