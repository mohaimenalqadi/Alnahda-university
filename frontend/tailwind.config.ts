import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Al-Nahda University Brand Colors
                primary: {
                    50: '#fffcf0',
                    100: '#fff9e0',
                    200: '#fff1b8',
                    300: '#ffd875',
                    400: '#ffc23d',
                    500: '#d4af37', // Brand Gold
                    600: '#b8860b', // Deep Gold
                    700: '#8b6508',
                    800: '#6d4f07',
                    900: '#573f06',
                    950: '#302303',
                },
                secondary: {
                    50: '#fdf7ef',
                    100: '#faebda',
                    200: '#f4d4b4',
                    300: '#ecb785',
                    400: '#e39154',
                    500: '#db7433',
                    600: '#cc5c28',
                    700: '#a94623',
                    800: '#883923',
                    900: '#6e311f',
                    950: '#3b170e',
                },
                success: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                },
                warning: {
                    50: '#fffbeb',
                    100: '#fef3c7',
                    200: '#fde68a',
                    300: '#fcd34d',
                    400: '#fbbf24',
                    500: '#f59e0b',
                    600: '#d97706',
                    700: '#b45309',
                    800: '#92400e',
                    900: '#78350f',
                },
                danger: {
                    50: '#fef2f2',
                    100: '#fee2e2',
                    200: '#fecaca',
                    300: '#fca5a5',
                    400: '#f87171',
                    500: '#ef4444',
                    600: '#dc2626',
                    700: '#b91c1c',
                    800: '#991b1b',
                    900: '#7f1d1d',
                },
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
                arabic: ['var(--font-cairo)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
            },
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '112': '28rem',
                '128': '32rem',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
            borderRadius: {
                '4xl': '2rem',
                '5xl': '3rem',
            },
            boxShadow: {
                'gold': '0 10px 30px -10px rgba(212, 175, 55, 0.3)',
                'premium': '0 20px 50px -12px rgba(0, 0, 0, 0.5)',
            },
        },
    },
    plugins: [],
};

export default config;
