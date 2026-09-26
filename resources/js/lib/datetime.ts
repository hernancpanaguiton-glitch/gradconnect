/**
 * Bridging UTC instants and `<input type="datetime-local">`.
 *
 * The app stores and sends instants in UTC, but a datetime-local input has no
 * timezone — it shows and returns a bare local wall-clock reading. Feeding a
 * UTC string straight in made the field claim 18:00 for an instant that is
 * 02:00 the next day in Manila, so the survey list and the edit form
 * disagreed by a day and "correcting" the field shifted the real time by
 * eight hours.
 */

function pad(value: number): string {
    return String(value).padStart(2, '0');
}

/** A UTC instant as the local wall-clock reading an input should display. */
export function toLocalDatetime(iso: string | null): string {
    if (!iso) {
        return '';
    }

    const at = new Date(iso);

    if (Number.isNaN(at.getTime())) {
        return '';
    }

    return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}T${pad(at.getHours())}:${pad(at.getMinutes())}`;
}

/** The inverse: the UTC instant a local wall-clock reading names. */
export function toUtcInstant(local: string): string {
    if (!local) {
        return '';
    }

    const at = new Date(local);

    return Number.isNaN(at.getTime()) ? '' : at.toISOString();
}
