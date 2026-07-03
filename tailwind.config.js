import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/**
 * GradConnect design system (ported from the Figma "GradConnect Web Application UI/UX").
 *
 * Two layers:
 *  1. Semantic tokens (bg-background, bg-card, text-foreground, bg-primary…) backed
 *     by CSS variables in app.css that flip between light and `.dark`. New Figma-ported
 *     pages use these so dark mode works everywhere for free.
 *  2. The indigo/slate/gray scales are remapped to the cobalt/navy/cool-blue palette so
 *     the original pages already match the identity.
 */
export default {
    darkMode: 'class',

    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
                display: ['"Plus Jakarta Sans"', 'Inter', ...defaultTheme.fontFamily.sans],
                mono: ['"DM Mono"', ...defaultTheme.fontFamily.mono],
            },
            colors: {
                // Semantic tokens (light/dark via CSS variables).
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                card: 'var(--card)',
                'card-foreground': 'var(--card-foreground)',
                popover: 'var(--popover)',
                'popover-foreground': 'var(--popover-foreground)',
                primary: {
                    DEFAULT: 'var(--primary)',
                    foreground: 'var(--primary-foreground)',
                },
                secondary: {
                    DEFAULT: 'var(--secondary)',
                    foreground: 'var(--secondary-foreground)',
                },
                muted: {
                    DEFAULT: 'var(--muted)',
                    foreground: 'var(--muted-foreground)',
                },
                accent: {
                    DEFAULT: 'var(--accent)',
                    foreground: 'var(--accent-foreground)',
                },
                destructive: {
                    DEFAULT: 'var(--destructive)',
                    foreground: 'var(--destructive-foreground)',
                },
                border: 'var(--border)',
                input: 'var(--input)',
                ring: 'var(--ring)',
                sidebar: {
                    DEFAULT: 'var(--sidebar)',
                    foreground: 'var(--sidebar-foreground)',
                    primary: 'var(--sidebar-primary)',
                    'primary-foreground': 'var(--sidebar-primary-foreground)',
                    accent: 'var(--sidebar-accent)',
                    'accent-foreground': 'var(--sidebar-accent-foreground)',
                    border: 'var(--sidebar-border)',
                },
                chart: {
                    1: 'var(--chart-1)',
                    2: 'var(--chart-2)',
                    3: 'var(--chart-3)',
                    4: 'var(--chart-4)',
                    5: 'var(--chart-5)',
                },

                // Primary — UCLM cobalt blue (#1a56db at 600).
                indigo: {
                    50: '#eef4fe', 100: '#e0eafc', 200: '#c3d5f9', 300: '#93b4f4',
                    400: '#5a8bec', 500: '#2f6ae0', 600: '#1a56db', 700: '#1546b0',
                    800: '#173e92', 900: '#173776', 950: '#0f2247',
                },
                // Deep navy (sidebar / ink), 900 = #0f1f3d.
                slate: {
                    50: '#f1f5fa', 100: '#e6ecf5', 200: '#cbd5e8', 300: '#a3b3d0',
                    400: '#6b7fa5', 500: '#47597e', 600: '#33456b', 700: '#1a3a6b',
                    800: '#142a4f', 900: '#0f1f3d', 950: '#07101f',
                },
                // Cool blue-tinted neutrals.
                gray: {
                    50: '#f0f4f9', 100: '#e8eef7', 200: '#e0e7f1', 300: '#cdd8e8',
                    400: '#93a5c4', 500: '#5a6a85', 600: '#465671', 700: '#374357',
                    800: '#1e2a44', 900: '#0f1f3d', 950: '#08132a',
                },
            },
        },
    },

    plugins: [forms],
};
