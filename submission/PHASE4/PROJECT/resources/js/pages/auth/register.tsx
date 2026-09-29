import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout } from '@/layouts/auth-layout';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({ name: '', email: '', password: '', password_confirmation: '' });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        post('/register', { onFinish: () => reset('password', 'password_confirmation') });
    }

    return (
        <AuthLayout>
            <Head title="Register" />
            <Card className="animate-rise-in border-0 bg-transparent shadow-none sm:border sm:bg-card sm:shadow-sm">
                <CardHeader className="px-0 sm:px-6"><CardTitle className="text-2xl">Join the garden</CardTitle><CardDescription>Create a member account to get started.</CardDescription></CardHeader>
                <CardContent className="px-0 sm:px-6">
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2"><Label htmlFor="name">Full name</Label><Input id="name" autoComplete="name" autoFocus required minLength={2} maxLength={255} value={data.name} onChange={(event) => setData('name', event.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'register-name-error' : undefined} />{errors.name && <p id="register-name-error" role="alert" className="text-sm text-destructive">{errors.name}</p>}</div>
                        <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" type="email" autoComplete="email" required maxLength={255} value={data.email} onChange={(event) => setData('email', event.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'register-email-error' : undefined} />{errors.email && <p id="register-email-error" role="alert" className="text-sm text-destructive">{errors.email}</p>}</div>
                        <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="new-password" required minLength={8} value={data.password} onChange={(event) => setData('password', event.target.value)} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'register-password-error' : 'register-password-help'} /><p id="register-password-help" className="text-xs text-muted-foreground">Use at least 8 characters.</p>{errors.password && <p id="register-password-error" role="alert" className="text-sm text-destructive">{errors.password}</p>}</div>
                        <div className="space-y-2"><Label htmlFor="password_confirmation">Confirm password</Label><Input id="password_confirmation" type="password" autoComplete="new-password" required minLength={8} value={data.password_confirmation} onChange={(event) => setData('password_confirmation', event.target.value)} /></div>
                        <Button type="submit" className="mt-2 w-full" disabled={processing}>{processing ? 'Creating account…' : 'Create member account'}<ArrowRight /></Button>
                    </form>
                    <p className="mt-6 text-center text-sm text-muted-foreground">Already registered? <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">Sign in</Link></p>
                </CardContent>
            </Card>
        </AuthLayout>
    );
}
