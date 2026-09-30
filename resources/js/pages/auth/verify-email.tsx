import { Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { AuthPanel } from '@/components/auth-panel';
import { Button } from '@/components/ui/button';
import type { SharedPageProps } from '@/types';

export default function VerifyEmail({ status }: { status?: string }) {
    const { auth, flash, errors } = usePage<SharedPageProps>().props;
    const form = useForm({});
    const [cooldown, setCooldown] = useState(status === 'verification-link-sent' ? 60 : 0);
    useEffect(() => {
        if (cooldown === 0) return;
        const timeout = window.setTimeout(() => setCooldown(value => value - 1), 1000);
        return () => window.clearTimeout(timeout);
    }, [cooldown]);

    return <AuthPanel title="Confirm your email" description="Open the confirmation link in your email before using your garden workspace.">
        <p className="text-sm leading-6 text-muted-foreground">We sent a confirmation link to <strong className="break-all text-foreground">{auth.user?.email}</strong>. Check your inbox and spam folder. The link expires after 60 minutes.</p>
        {status === 'verification-link-sent' && <p role="status" className="rounded-xl bg-primary/10 p-3 text-sm text-primary">A new confirmation link has been sent.</p>}
        {flash.error && <p role="alert" className="text-sm text-destructive">{flash.error}</p>}
        {errors.email && <p role="alert" className="text-sm text-destructive">{errors.email}</p>}
        <Button className="w-full" disabled={form.processing || cooldown > 0} onClick={() => form.post('/email/verification-notification', { onSuccess: () => setCooldown(60) })}>{form.processing ? 'Sending…' : cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend confirmation email'}</Button>
        <div className="flex items-center justify-between text-sm"><Link href="/settings" className="font-medium text-primary hover:underline">Change email address</Link><button type="button" onClick={() => router.post('/logout')} className="font-medium text-primary hover:underline">Log out</button></div>
    </AuthPanel>;
}
