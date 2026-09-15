export type UserRole = 'admin' | 'staff' | 'member';

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
}

export interface SharedPageProps {
    [key: string]: unknown;
    auth: { user: User | null };
    flash: { success?: string; error?: string };
}
