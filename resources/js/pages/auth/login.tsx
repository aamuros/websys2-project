import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout } from '@/layouts/auth-layout';

export default function Login({ status }: { status?: string }) {
    const { data, setData, post, processing, errors, reset } = useForm({ email: '', password: '', remember: false });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        post('/login', { onFinish: () => reset('password') });
    }

    return (
        <AuthLayout>
            <Head title="Log in" />
            <Card className="animate-rise-in border-0 bg-transparent shadow-none sm:border sm:bg-card sm:shadow-sm">
                <CardHeader className="px-0 sm:px-6"><CardTitle className="text-2xl">Welcome back</CardTitle><CardDescription>Sign in to continue to your garden workspace.</CardDescription></CardHeader>
                <CardContent className="px-0 sm:px-6">
                    {status && <p role="status" className="mb-5 rounded-xl bg-primary/10 p-3 text-sm leading-6 text-primary">{status}</p>}
                    <form onSubmit={submit} className="space-y-5">
                        <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" type="email" autoComplete="email" autoFocus required maxLength={255} value={data.email} onChange={(event) => setData('email', event.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'login-email-error' : undefined} />{errors.email && <p id="login-email-error" role="alert" className="text-sm text-destructive">{errors.email}</p>}</div>
                        <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="current-password" required value={data.password} onChange={(event) => setData('password', event.target.value)} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'login-password-error' : undefined} />{errors.password && <p id="login-password-error" role="alert" className="text-sm text-destructive">{errors.password}</p>}</div>
                        <div className="flex items-center justify-between gap-3 text-sm"><label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-primary" checked={data.remember} onChange={event => setData('remember', event.target.checked)} />Remember me</label><Link href="/forgot-password" className="font-medium text-primary hover:underline">Forgot password?</Link></div>
                        <Button type="submit" className="w-full" disabled={processing}>{processing ? 'Signing in…' : 'Sign in'}<ArrowRight /></Button>
                    </form>
                    <p className="mt-6 text-center text-sm text-muted-foreground">New to the garden? <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">Create an account</Link></p>
                </CardContent>
            </Card>
        </AuthLayout>
    );
}
