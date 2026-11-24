import { useEffect, useRef, useState } from 'react';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

/**
 * An in-app replacement for window.confirm(), whose box is titled with the
 * site's address ("gradconnect.tech says") and cannot be styled.
 *
 *     if (!(await confirmDialog('Delete this event?', { confirmLabel: 'Delete' }))) return;
 *
 * <ConfirmHost /> is mounted once, in app.tsx.
 */
type Options = { confirmLabel?: string; danger?: boolean };
type Request = Required<Options> & { message: string; resolve: (ok: boolean) => void };

let open: ((request: Request) => void) | null = null;

export function confirmDialog(message: string, { confirmLabel = 'Confirm', danger = true }: Options = {}): Promise<boolean> {
    // No host mounted (e.g. a component rendered alone): fall back rather than hang.
    if (!open) return Promise.resolve(window.confirm(message));

    return new Promise((resolve) => open!({ message, confirmLabel, danger, resolve }));
}

export function ConfirmHost() {
    const [request, setRequest] = useState<Request | null>(null);
    const [show, setShow] = useState(false);
    const answered = useRef(true);

    useEffect(() => {
        open = (next) => {
            answered.current = false;
            setRequest(next);
            setShow(true);
        };

        return () => {
            open = null;
        };
    }, []);

    // Keep the request after closing, so the text stays put while the modal fades out.
    const answer = (ok: boolean) => {
        if (answered.current) return;
        answered.current = true;
        request?.resolve(ok);
        setShow(false);
    };

    const Confirm = request?.danger ? DangerButton : PrimaryButton;

    return (
        <Modal show={show} maxWidth="md" onClose={() => answer(false)}>
            <div className="p-6">
                <p className="text-base text-foreground">{request?.message}</p>
                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton onClick={() => answer(false)}>Cancel</SecondaryButton>
                    <Confirm onClick={() => answer(true)} autoFocus>
                        {request?.confirmLabel}
                    </Confirm>
                </div>
            </div>
        </Modal>
    );
}
