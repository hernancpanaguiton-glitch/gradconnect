import { formatSalary } from '@/Pages/Jobs/Show';
import { describe, expect, it } from 'vitest';

describe('formatSalary', () => {
    it('keeps a comma-grouped range intact', () => {
        // The posting form's own placeholder is "₱20,000 – ₱30,000/mo".
        // Matching bare digit runs split that into 20/000/30/000, so the job
        // advertised "₱20–000 / month" — while the jobs board showed the raw
        // string correctly, so the two pages disagreed about the pay.
        expect(formatSalary('₱20,000 – ₱30,000/mo')).toBe('₱20,000–₱30,000 / month');
    });

    it('formats a plain unseparated range', () => {
        expect(formatSalary('30000-50000')).toBe('₱30,000–₱50,000 / month');
    });

    it('keeps the plus on an open-ended figure', () => {
        expect(formatSalary('80,000+')).toBe('₱80,000+ / month');
    });

    it('formats a single figure', () => {
        expect(formatSalary('25000')).toBe('₱25,000 / month');
    });

    it('leaves text with no figures alone', () => {
        expect(formatSalary('Negotiable')).toBe('Negotiable');
        expect(formatSalary('Depends on experience')).toBe('Depends on experience');
    });

    it('never renders a lone thousands group as if it were the upper bound', () => {
        // The failure this guards against always looked like a plausible
        // number, which is why it survived: "₱20–000" reads as a typo, not
        // as a parsing bug.
        ['₱20,000 – ₱30,000/mo', '₱18,500-₱24,000', '1,200,000 per year'].forEach((input) => {
            expect(formatSalary(input)).not.toMatch(/[–-]₱?0{3}\b/);
        });
    });
});
