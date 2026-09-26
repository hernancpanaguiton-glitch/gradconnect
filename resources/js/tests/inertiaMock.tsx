import { ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { vi } from 'vitest';

/**
 * A stand-in for @inertiajs/react under jsdom.
 *
 * The real package expects a running Inertia app — a page object, a router and
 * a history adapter — so a component that merely renders a <Link> cannot be
 * mounted without it. This provides just enough to exercise component
 * behaviour: links become anchors, useForm tracks state and records requests,
 * and usePage returns whatever props a test sets.
 *
 * Use it from a test with:
 *   vi.mock('@inertiajs/react', async () => await import('@/tests/inertiaMock'));
 */

type Props = Record<string, unknown>;

/** Requests every mocked form and the router made, newest last. */
export interface RecordedVisit {
    method: 'get' | 'post' | 'put' | 'patch' | 'delete';
    url: string;
    data?: Props;
}

const state: { pageProps: Props; visits: RecordedVisit[] } = { pageProps: {}, visits: [] };

/** Set the props usePage() should return, and clear recorded visits. */
export function setPageProps(props: Props): void {
    state.pageProps = props;
    state.visits = [];
}

export function recordedVisits(): RecordedVisit[] {
    return state.visits;
}

export function lastVisit(): RecordedVisit | undefined {
    return state.visits[state.visits.length - 1];
}

export function resetInertiaMock(): void {
    state.pageProps = {};
    state.visits = [];
}

export function Head({ title }: { title?: string; children?: ReactNode }) {
    if (title) {
        document.title = title;
    }

    return null;
}

export function Link({
    href,
    children,
    as,
    method,
    preserveScroll: _preserveScroll,
    preserveState: _preserveState,
    only: _only,
    ...rest
}: {
    href: string;
    children?: ReactNode;
    as?: string;
    method?: string;
    preserveScroll?: boolean;
    preserveState?: boolean;
    only?: string[];
    [key: string]: unknown;
}) {
    if (as === 'button') {
        return (
            <button type="button" data-href={href} data-method={method} {...(rest as object)}>
                {children}
            </button>
        );
    }

    return (
        <a href={href} data-method={method} {...(rest as object)}>
            {children}
        </a>
    );
}

function record(method: RecordedVisit['method'], url: string, data?: Props) {
    state.visits.push({ method, url, data });
}

export const router = {
    get: vi.fn((url: string, data?: Props) => record('get', url, data)),
    post: vi.fn((url: string, data?: Props) => record('post', url, data)),
    put: vi.fn((url: string, data?: Props) => record('put', url, data)),
    patch: vi.fn((url: string, data?: Props) => record('patch', url, data)),
    delete: vi.fn((url: string, data?: Props) => record('delete', url, data)),
    reload: vi.fn(),
    visit: vi.fn((url: string) => record('get', url)),
};

export function usePage<T = Props>() {
    return { props: state.pageProps as T, url: '/', component: 'Test', version: null };
}

/**
 * A working useForm: enough for tests to type into fields, submit, and assert
 * on what would have been sent. Server errors are injected with setError.
 */
export function useForm<T extends Props>(initial: T) {
    const [data, setDataState] = useState<T>(initial);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const defaults = useRef(initial);

    const setData = useCallback((keyOrValues: string | Partial<T>, value?: unknown) => {
        setDataState((current) =>
            typeof keyOrValues === 'string'
                ? ({ ...current, [keyOrValues]: value } as T)
                : ({ ...current, ...keyOrValues } as T)
        );
    }, []);

    const submit = useCallback(
        (method: RecordedVisit['method']) => (url: string, options?: { onSuccess?: () => void; onFinish?: () => void }) => {
            setProcessing(true);
            record(method, url, data);
            options?.onSuccess?.();
            options?.onFinish?.();
            setProcessing(false);
        },
        [data]
    );

    const isDirty = useMemo(() => JSON.stringify(data) !== JSON.stringify(defaults.current), [data]);

    return {
        data,
        setData,
        errors,
        setError: (key: string, message: string) => setErrors((current) => ({ ...current, [key]: message })),
        clearErrors: () => setErrors({}),
        processing,
        isDirty,
        hasErrors: Object.keys(errors).length > 0,
        progress: null,
        wasSuccessful: false,
        recentlySuccessful: false,
        transform: () => undefined,
        reset: (...fields: string[]) =>
            setDataState((current) =>
                fields.length === 0
                    ? defaults.current
                    : ({ ...current, ...Object.fromEntries(fields.map((f) => [f, defaults.current[f]])) } as T)
            ),
        get: submit('get'),
        post: submit('post'),
        put: submit('put'),
        patch: submit('patch'),
        delete: submit('delete'),
    };
}
