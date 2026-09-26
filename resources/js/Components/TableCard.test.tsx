import TableCard from '@/Components/TableCard';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

function renderTable(wide = false) {
    const { container } = render(
        <TableCard wide={wide}>
            <table>
                <tbody>
                    <tr>
                        <td>Ada Lovelace</td>
                        <td>Edit</td>
                    </tr>
                </tbody>
            </table>
        </TableCard>
    );

    const card = container.firstChild as HTMLElement;

    return { card, scroller: card.firstChild as HTMLElement };
}

describe('TableCard', () => {
    it('scrolls the table instead of clipping it', () => {
        // Tables used to sit straight inside an overflow-hidden card, so on a
        // phone the right-hand columns — almost always the action buttons —
        // were cut off with no way to reach them.
        const { card, scroller } = renderTable();

        expect(card.className).toContain('overflow-hidden');
        expect(scroller.className).toContain('overflow-x-auto');
    });

    it('keeps the table wide enough for its columns to stay legible', () => {
        const { scroller } = renderTable();

        expect(scroller.className).toContain('min-w-[40rem]');
    });

    it('gives a column-heavy table more room', () => {
        const { scroller } = renderTable(true);

        expect(scroller.className).toContain('min-w-[56rem]');
    });
});
