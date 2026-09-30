import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { AuthPanel } from '@/components/auth-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPassword({ status }: { status?: string }) {
    const form = useForm({ email: '' });
    function submit(event: FormEvent) {
        event.preventDefault();
        form.post('/forgot-password');
    }

    return <AuthPanel title="Forgot your password?" description="Enter your email address and we’ll send you a link to set a new password.">
        {status && <p role="status" className="rounded-xl bg-primary/10 p-3 text-sm leading-6 text-primary">{status}</p>}
        <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" type="email" autoComplete="email" required autoFocus maxLength={255} value={form.data.email} onChange={event => form.setData('email', event.target.value)} aria-invalid={!!form.errors.email} aria-describedby={form.errors.email ? 'forgot-email-error' : undefined} />{form.errors.email && <p id="forgot-email-error" role="alert" className="text-sm text-destructive">{form.errors.email}</p>}</div>
            <Button className="w-full" disabled={form.processing}>{form.processing ? 'Sending…' : 'Send reset link'}</Button>
        </form>
        <p className="text-center text-sm"><Link href="/login" className="font-medium text-primary hover:underline">Back to sign in</Link></p>
    </AuthPanel>;
}
