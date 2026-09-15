import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { StrictMode, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Community Garden';
const pages = import.meta.glob<{ default: ComponentType }>('./pages/**/*.tsx', { eager: true });

void createInertiaApp({
    title: (title) => `${title} · ${appName}`,
    resolve: (name) => {
        const page = pages[`./pages/${name}.tsx`];

        if (!page) {
            throw new Error(`Page not found: ${name}`);
        }

        return page.default;
    },
    setup({ el, App, props }) {
        if (!el) return;

        createRoot(el).render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: { color: '#2f6857' },
});
