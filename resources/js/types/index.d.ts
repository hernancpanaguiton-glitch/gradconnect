export interface User {
    id: number;
    first_name: string;
    last_name: string;
    name: string; // computed: first_name + ' ' + last_name
    id_number?: string | null;
    email: string;
    email_verified_at?: string;
    status: 'active' | 'pending' | 'suspended';
    department_id?: number | null;
    department?: { id: number; name: string; code: string | null } | null;
    roles: string[];
    permissions: string[];
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    flash?: {
        success?: string;
        error?: string;
    };
    notifications?: {
        unread: number;
        items: NotificationItem[];
    };
    maintenanceBanner?: string | null;
};

/** A program (degree course) or, with `children`, the college above it. */
export interface Program {
    id: number;
    name: string;
    code: string | null;
}

export interface College extends Program {
    children?: Program[];
}

/**
 * One illustrative AI match per college, from App\Support\UclmCatalog. The
 * employer is a generic TYPE of employer, never a real company.
 */
export interface MatchShowcaseItem {
    college_code: string;
    college_name: string;
    short_label: string;
    job_title: string;
    match: number;
    skills: Array<{ name: string; match: number }>;
    employer_type: string;
    salary_min: number;
    salary_max: number;
    location: string;
}

export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    url: string | null;
    read: boolean;
    time: string;
}
