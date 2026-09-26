import FitScoreBar from '@/Components/FitScoreBar';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

/** The inner filled element, whose inline width draws the bar. */
function barWidth(container: HTMLElement): string {
    const track = container.querySelector('.bg-gray-100') as HTMLElement;

    return (track.firstElementChild as HTMLElement).style.width;
}

function percent(width: string): number {
    expect(width, 'width must be a percentage the browser will accept').toMatch(/^\d+(\.\d+)?%$/);

    return Number.parseFloat(width);
}

describe('FitScoreBar', () => {
    it('draws a scored match proportionally', () => {
        const { container } = render(<FitScoreBar fitScore={72} similarity={0.8} recommendation="moderate" />);

        expect(percent(barWidth(container))).toBe(72);
    });

    it('never draws past a full bar', () => {
        // fit_score comes straight from the model's JSON with no range rule,
        // so a hallucinated 120 would overflow its own rounded track.
        const { container } = render(<FitScoreBar fitScore={120} similarity={null} recommendation="strong" />);

        expect(percent(barWidth(container))).toBeLessThanOrEqual(100);
    });

    it('draws an unscored match from its similarity', () => {
        const { container } = render(<FitScoreBar fitScore={null} similarity={0.42} recommendation={null} />);

        expect(percent(barWidth(container))).toBeCloseTo(42, 0);
    });

    it('draws the weakest possible match as an empty bar, not a full one', () => {
        // pgvector cosine distance spans [0,2], so 1 - distance can be
        // negative. "width: -38%" is invalid, the browser drops the
        // declaration, and the block falls back to width:auto — filling the
        // track. The worst candidate on the page rendered as the fullest bar.
        const { container } = render(<FitScoreBar fitScore={null} similarity={-0.38} recommendation={null} />);

        expect(percent(barWidth(container))).toBe(0);
    });

    it('treats a missing similarity as an empty bar', () => {
        const { container } = render(<FitScoreBar fitScore={null} similarity={null} recommendation={null} />);

        expect(percent(barWidth(container))).toBe(0);
        expect(container.textContent).toContain('Not scored');
    });

    it('colours the bar by recommendation, falling back for an unknown one', () => {
        const strong = render(<FitScoreBar fitScore={90} similarity={null} recommendation="strong" />);
        expect(strong.container.querySelector('.bg-green-500')).toBeInTheDocument();

        const odd = render(<FitScoreBar fitScore={90} similarity={null} recommendation="spectacular" />);
        expect(odd.container.querySelector('.bg-indigo-500')).toBeInTheDocument();
    });

    it('still reports the real score in the label when it is out of range', () => {
        // Clamp the drawing, not the number: a nonsense score should stay
        // visible so it can be spotted, rather than being quietly rounded.
        const { container } = render(<FitScoreBar fitScore={120} similarity={null} recommendation="strong" />);

        expect(container.textContent).toContain('120% fit');
    });
});
