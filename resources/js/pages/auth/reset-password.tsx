import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { AuthPanel } from '@/components/auth-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPassword({ token, email }: { token: string; email: string }) {
    const form = useForm({ token, email, password: '', password_confirmation: '' });
    function submit(event: FormEvent) {
        event.preventDefault();
        form.post('/reset-password', { onFinish: () => form.reset('password', 'password_confirmation') });
    }

    return <AuthPanel title="Set a new password" description="Choose a password with at least 8 characters. You’ll sign in again after resetting it.">
        <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" type="email" autoComplete="email" required maxLength={255} value={form.data.email} onChange={event => form.setData('email', event.target.value)} aria-invalid={!!form.errors.email} aria-describedby={form.errors.email ? 'reset-email-error' : undefined} />{form.errors.email && <p id="reset-email-error" role="alert" className="text-sm text-destructive">{form.errors.email}</p>}</div>
            <div className="space-y-2"><Label htmlFor="password">New password</Label><Input id="password" type="password" autoComplete="new-password" autoFocus required minLength={8} value={form.data.password} onChange={event => form.setData('password', event.target.value)} aria-invalid={!!form.errors.password} aria-describedby={form.errors.password ? 'reset-password-error' : undefined} />{form.errors.password && <p id="reset-password-error" role="alert" className="text-sm text-destructive">{form.errors.password}</p>}</div>
            <div className="space-y-2"><Label htmlFor="password_confirmation">Confirm new password</Label><Input id="password_confirmation" type="password" autoComplete="new-password" required minLength={8} value={form.data.password_confirmation} onChange={event => form.setData('password_confirmation', event.target.value)} /></div>
            {form.errors.token && <p role="alert" className="text-sm text-destructive">{form.errors.token}</p>}
            <Button className="w-full" disabled={form.processing}>{form.processing ? 'Resetting…' : 'Reset password'}</Button>
        </form>
        <p className="text-center text-sm"><Link href="/forgot-password" className="font-medium text-primary hover:underline">Request a new reset link</Link></p>
    </AuthPanel>;
}
