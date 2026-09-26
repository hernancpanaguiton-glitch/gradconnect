import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
    cleanup();
});

/**
 * Ziggy's `route()` is injected globally by the app's Blade template, so it is
 * absent under jsdom. Components only ever use the returned string as an href.
 */
(globalThis as unknown as { route: (name: string, params?: unknown) => string }).route = (name, params) =>
    `/${name}${params ? `/${String(params)}` : ''}`;

/**
 * jsdom implements neither of these, and a component that queries them on
 * mount would otherwise throw before its own logic ever runs.
 */
if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }));
}

if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
}
