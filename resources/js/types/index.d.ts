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
};
