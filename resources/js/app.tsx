import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ConfirmHost } from './lib/confirm';

// Docker builds have no .env, so the fallback is what users actually see.
const appName = import.meta.env.VITE_APP_NAME || 'GradConnect';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                <App {...props} />
                <ConfirmHost />
            </>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});
