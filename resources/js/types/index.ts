export type UserRole = 'admin' | 'staff' | 'member';

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    email_verified_at: string | null;
}

export interface SharedPageProps {
    [key: string]: unknown;
    auth: { user: User | null };
    errors: Record<string, string>;
    flash: { success?: string; error?: string };
    notifications: { unreadCount: number; items: Array<{ id: string; message: string; url: string; read: boolean; created_at: string }> };
}
