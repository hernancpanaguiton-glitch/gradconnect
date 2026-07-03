import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/**
 * GradConnect design system (from the Figma "GradConnect Web Application UI/UX").
 *
 * The app was built with raw Tailwind utilities (indigo = primary, slate = dark
 * sidebar, gray = neutrals), so instead of rewriting every component we remap
 * those scales to the Figma palette:
 *   - indigo → UCLM cobalt blue (#1a56db primary)
 *   - slate  → deep navy (sidebar #0f1f3d)
 *   - gray   → cool blue-tinted neutrals (page bg #f0f4f9, ink #0f1f3d)
 */
export default {
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
                // Primary — UCLM cobalt blue, centred on #1a56db at 600.
                indigo: {
                    50: '#eef4fe',
                    100: '#e0eafc',
                    200: '#c3d5f9',
                    300: '#93b4f4',
                    400: '#5a8bec',
                    500: '#2f6ae0',
                    600: '#1a56db',
                    700: '#1546b0',
                    800: '#173e92',
                    900: '#173776',
                    950: '#0f2247',
                },
                // Dark sidebar / headings — deep navy, 900 = #0f1f3d.
                slate: {
                    50: '#f1f5fa',
                    100: '#e6ecf5',
                    200: '#cbd5e8',
                    300: '#a3b3d0',
                    400: '#6b7fa5',
                    500: '#47597e',
                    600: '#33456b',
                    700: '#1a3a6b',
                    800: '#142a4f',
                    900: '#0f1f3d',
                    950: '#07101f',
                },
                // Neutrals — cool blue-tinted, page bg #f0f4f9, ink #0f1f3d.
                gray: {
                    50: '#f0f4f9',
                    100: '#e8eef7',
                    200: '#e0e7f1',
                    300: '#cdd8e8',
                    400: '#93a5c4',
                    500: '#5a6a85',
                    600: '#465671',
                    700: '#374357',
                    800: '#1e2a44',
                    900: '#0f1f3d',
                    950: '#08132a',
                },
            },
        },
    },

    plugins: [forms],
};
