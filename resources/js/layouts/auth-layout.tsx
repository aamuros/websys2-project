import type { PropsWithChildren } from 'react';
import { BrandMark } from '@/components/brand-mark';

export function AuthLayout({ children }: PropsWithChildren) {
    return (
        <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(360px,0.85fr)_1.15fr]">
            <section className="relative hidden min-h-screen overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
                <BrandMark className="[&_span:last-child]:text-primary-foreground/65" />
                <div className="relative z-10 max-w-md animate-rise-in">
                    <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground/65">Grow together</p>
                    <h1 className="text-4xl font-semibold leading-tight tracking-[-0.035em]">One clear place for plots, people, and garden work.</h1>
                    <p className="mt-5 max-w-sm text-sm leading-6 text-primary-foreground/72">A shared workspace for the community members and staff who keep every garden bed thriving.</p>
                </div>
                <p className="relative z-10 text-xs text-primary-foreground/55">Built for accountable, community-led gardening.</p>
                <div className="absolute -bottom-40 -right-40 size-[32rem] rounded-full border border-primary-foreground/10" />
                <div className="absolute -bottom-20 -right-20 size-80 rounded-full border border-primary-foreground/10" />
                <div className="absolute bottom-5 right-5 size-36 rounded-full border border-primary-foreground/10" />
            </section>
            <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
                <div className="w-full max-w-md">
                    <BrandMark className="mb-10 lg:hidden" />
                    {children}
                </div>
            </section>
        </main>
    );
}
