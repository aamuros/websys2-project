import { useForm, usePage } from '@inertiajs/react';
import { Check, LockKeyhole, Settings, UserRound, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/workspace-ui';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

const sections = [
    { id: 'profile', label: 'Profile', icon: UserRound },
    { id: 'password', label: 'Password', icon: LockKeyhole },
] as const;

export function SettingsModal({ onClose, onRestoreFocus }: { onClose: () => void; onRestoreFocus: () => void }) {
    const user = usePage<SharedPageProps>().props.auth.user!;
    const [section, setSection] = useState<'profile' | 'password'>('profile');
    const [saved, setSaved] = useState('');
    const profile = useForm({ name: user.name, email: user.email });
    const password = useForm({ current_password: '', password: '', password_confirmation: '' });
    const processing = profile.processing || password.processing;

    function submitProfile(event: FormEvent) {
        event.preventDefault();
        setSaved('');
        profile.put('/settings/profile', {
            preserveScroll: true,
            onSuccess: () => {
                profile.setDefaults(profile.data);
                setSaved('Profile updated.');
            },
        });
    }

    function submitPassword(event: FormEvent) {
        event.preventDefault();
        setSaved('');
        password.put('/settings/password', {
            preserveScroll: true,
            onSuccess: () => {
                password.reset();
                setSaved('Password updated.');
            },
        });
    }

    return (
        <Dialog open onOpenChange={open => { if (!open && !processing) onClose(); }}>
            <DialogContent
                showCloseButton={false}
                className="flex h-[min(640px,calc(100dvh-2rem))] max-w-4xl flex-col gap-0 overflow-hidden rounded-3xl bg-card p-0 sm:flex-row"
                onCloseAutoFocus={event => { event.preventDefault(); onRestoreFocus(); }}
                onEscapeKeyDown={event => { if (processing) event.preventDefault(); }}
                onPointerDownOutside={event => { if (processing) event.preventDefault(); }}
            >
                <aside className="flex shrink-0 flex-col border-b border-border/60 bg-background p-4 sm:w-52 sm:border-b-0 sm:border-r sm:p-5">
                    <div className="flex items-center gap-2 pr-10 sm:pr-0">
                        <Settings className="size-4 text-muted-foreground" aria-hidden="true" />
                        <DialogTitle className="text-base font-semibold">Settings</DialogTitle>
                    </div>
                    <DialogDescription className="sr-only">Manage your profile and account password.</DialogDescription>
                    <p className="mb-2 mt-8 hidden px-2 text-xs font-medium text-muted-foreground sm:block">Account</p>
                    <nav aria-label="Settings sections" className="mt-4 flex gap-1 sm:mt-0 sm:flex-col">
                        {sections.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                aria-pressed={section === id}
                                aria-controls="settings-content"
                                disabled={processing}
                                onClick={() => { setSection(id); setSaved(''); }}
                                className={cn('flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50 sm:flex-none', section === id ? 'bg-primary/[0.09] font-semibold text-foreground' : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground')}
                            >
                                <Icon className="size-4 shrink-0" aria-hidden="true" />
                                {label}
                            </button>
                        ))}
                    </nav>
                    <div className="mt-auto hidden items-center gap-2.5 border-t border-border/60 pt-4 sm:flex">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{user.name}</p>
                            <p className="mt-0.5 text-xs capitalize text-muted-foreground">{user.role}</p>
                        </div>
                    </div>
                </aside>

                <section id="settings-content" aria-labelledby="settings-section-title" className="app-scrollbar min-h-0 min-w-0 flex-1 overflow-y-auto px-5 pb-6 pt-6 sm:px-8 sm:pt-8">
                    <button type="button" onClick={onClose} disabled={processing} aria-label="Close settings" className="absolute right-4 top-4 grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50">
                        <X className="size-4" aria-hidden="true" />
                    </button>

                    <header className="border-b border-border/60 pb-6 sm:pr-8">
                        <h2 id="settings-section-title" className="text-xl font-semibold tracking-tight">{section === 'profile' ? 'Profile' : 'Change password'}</h2>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{section === 'profile' ? 'Update your name and the email you use to sign in.' : 'Confirm your current password to set a new one.'}</p>
                    </header>

                    {section === 'profile' ? (
                        <form onSubmit={submitProfile} className="pt-6">
                            <div className="mb-7 flex items-center gap-3">
                                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-lg font-semibold" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span>
                                <div className="min-w-0"><p className="truncate text-sm font-semibold">{user.name}</p><p className="truncate text-xs text-muted-foreground">{user.email}</p></div>
                            </div>
                            <fieldset disabled={processing} className="space-y-5">
                                <Field label="Full name" error={profile.errors.name}>
                                    <Input name="name" autoComplete="name" required maxLength={255} className="rounded-xl" aria-invalid={!!profile.errors.name} value={profile.data.name} onChange={event => { profile.setData('name', event.target.value); setSaved(''); }} />
                                </Field>
                                <Field label="Email address" error={profile.errors.email}>
                                    <Input name="email" type="email" autoComplete="email" required maxLength={255} className="rounded-xl" aria-invalid={!!profile.errors.email} value={profile.data.email} onChange={event => { profile.setData('email', event.target.value); setSaved(''); }} />
                                </Field>
                            </fieldset>
                            <div className="mt-8 flex flex-wrap justify-end gap-2 border-t border-border/60 pt-5">
                                <Button type="button" variant="ghost" disabled={processing || !profile.isDirty} onClick={() => { profile.reset(); profile.clearErrors(); setSaved(''); }}>Discard changes</Button>
                                <Button disabled={processing || !profile.isDirty}>{profile.processing ? 'Saving…' : 'Save changes'}</Button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={submitPassword} className="pt-6">
                            <fieldset disabled={processing} className="space-y-5">
                                <Field label="Current password" error={password.errors.current_password}>
                                    <Input name="current_password" type="password" autoComplete="current-password" required className="rounded-xl" aria-invalid={!!password.errors.current_password} value={password.data.current_password} onChange={event => { password.setData('current_password', event.target.value); setSaved(''); }} />
                                </Field>
                                <Field label="New password" error={password.errors.password}>
                                    <Input name="password" type="password" autoComplete="new-password" required className="rounded-xl" aria-invalid={!!password.errors.password} value={password.data.password} onChange={event => { password.setData('password', event.target.value); setSaved(''); }} />
                                </Field>
                                <Field label="Confirm new password" error={password.errors.password_confirmation}>
                                    <Input name="password_confirmation" type="password" autoComplete="new-password" required className="rounded-xl" aria-invalid={!!password.errors.password_confirmation} value={password.data.password_confirmation} onChange={event => { password.setData('password_confirmation', event.target.value); setSaved(''); }} />
                                </Field>
                            </fieldset>
                            <div className="mt-8 flex flex-wrap justify-end gap-2 border-t border-border/60 pt-5">
                                <Button type="button" variant="ghost" disabled={processing || !password.isDirty} onClick={() => { password.reset(); password.clearErrors(); setSaved(''); }}>Discard changes</Button>
                                <Button disabled={processing}>{password.processing ? 'Updating…' : 'Update password'}</Button>
                            </div>
                        </form>
                    )}
                    {saved && <p role="status" className="mt-4 flex items-center gap-2 text-sm text-primary"><Check className="size-4" aria-hidden="true" />{saved}</p>}
                </section>
            </DialogContent>
        </Dialog>
    );
}
