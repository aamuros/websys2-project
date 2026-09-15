import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout } from '@/layouts/auth-layout';

export default function Login() {
    const { data, setData, post, processing, errors, reset } = useForm({ email: '', password: '' });

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
                    <form onSubmit={submit} className="space-y-5">
                        <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" type="email" autoComplete="email" autoFocus value={data.email} onChange={(event) => setData('email', event.target.value)} aria-invalid={Boolean(errors.email)} />{errors.email && <p className="text-sm text-destructive">{errors.email}</p>}</div>
                        <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="current-password" value={data.password} onChange={(event) => setData('password', event.target.value)} aria-invalid={Boolean(errors.password)} />{errors.password && <p className="text-sm text-destructive">{errors.password}</p>}</div>
                        <Button type="submit" className="w-full" disabled={processing}>{processing ? 'Signing in…' : 'Sign in'}<ArrowRight /></Button>
                    </form>
                    <p className="mt-6 text-center text-sm text-muted-foreground">New to the garden? <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">Create an account</Link></p>
                </CardContent>
            </Card>
        </AuthLayout>
    );
}
