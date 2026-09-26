import { ReactNode } from 'react';

export interface ScrollTab<T extends string = string> {
    key: T;
    label: ReactNode;
}

/**
 * A tab bar that scrolls sideways instead of forcing the whole page to.
 *
 * Four labelled tabs need more width than a 375px phone has, and a row that
 * cannot wrap pushes the page itself wide — which is what clips form
 * placeholders on every other tab.
 *
 * The negative margin lets the scroller bleed to the screen edges so tabs
 * are not cut off mid-label inside the page gutter.
 */
export default function ScrollTabs<T extends string>({
    tabs,
    active,
    onChange,
    className = '',
}: {
    tabs: ReadonlyArray<ScrollTab<T>>;
    active: T;
    onChange: (key: T) => void;
    className?: string;
}) {
    return (
        <div className={`-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 ${className}`}>
            <div role="tablist" className="flex min-w-max gap-1 border-b border-border">
                {tabs.map((tab) => {
                    const selected = tab.key === active;

                    return (
                        <button
                            key={tab.key}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            onClick={() => onChange(tab.key)}
                            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                                selected
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
