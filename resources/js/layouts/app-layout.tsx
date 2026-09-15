import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, LayoutDashboard, LogOut, Menu, ShieldCheck, Sprout, UsersRound } from 'lucide-react';
import { useState, type PropsWithChildren, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BrandMark } from '@/components/brand-mark';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

const roleIcons = { member: Sprout, staff: UsersRound, admin: ShieldCheck };

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
    const { auth } = usePage<SharedPageProps>().props;
    const currentUrl = usePage().url;
    const user = auth.user!;
    const RoleIcon = roleIcons[user.role];
    const roleUrl = `/${user.role}/dashboard`;

    const itemClass = (active: boolean) => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground');

    return (
        <nav className="flex flex-1 flex-col" aria-label="Primary navigation">
            <div className="space-y-1">
                <Link href="/dashboard" onClick={onNavigate} className={itemClass(currentUrl === '/dashboard')}><LayoutDashboard className="size-4" />Overview</Link>
                <Link href={roleUrl} onClick={onNavigate} className={itemClass(currentUrl === roleUrl)}><RoleIcon className="size-4" />{user.role} workspace</Link>
            </div>
            <div className="mt-8">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">Coming next</p>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground/55">
                    <span className="flex items-center gap-3 px-3 py-2"><span className="size-1.5 rounded-full bg-border" />Garden plots</span>
                    <span className="flex items-center gap-3 px-3 py-2"><span className="size-1.5 rounded-full bg-border" />Plot requests</span>
                    <span className="flex items-center gap-3 px-3 py-2"><span className="size-1.5 rounded-full bg-border" />Assignments</span>
                </div>
            </div>
        </nav>
    );
}

export function AppLayout({ title, description, actions, children }: PropsWithChildren<{ title: string; description: string; actions?: ReactNode }>) {
    const { auth } = usePage<SharedPageProps>().props;
    const [mobileOpen, setMobileOpen] = useState(false);
    const user = auth.user!;

    return (
        <div className="min-h-screen bg-background">
            <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card p-5 lg:flex lg:flex-col">
                <BrandMark />
                <div className="mt-10 flex flex-1 flex-col"><Navigation /></div>
                <div className="border-t pt-4 text-xs leading-5 text-muted-foreground">Foundation release<br /><span className="text-foreground">Laravel · Inertia · React</span></div>
            </aside>

            <div className="lg:pl-64">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-10">
                    <div className="flex items-center gap-2">
                        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
                            <DialogTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation"><Menu /></Button></DialogTrigger>
                            <DialogContent className="left-0 top-0 h-dvh w-[min(86vw,320px)] max-w-none translate-x-0 translate-y-0 rounded-none border-y-0 border-l-0 p-5" showCloseButton>
                                <DialogTitle className="sr-only">Navigation</DialogTitle>
                                <BrandMark />
                                <div className="mt-9 flex min-h-0 flex-1 flex-col"><Navigation onNavigate={() => setMobileOpen(false)} /></div>
                            </DialogContent>
                        </Dialog>
                        <BrandMark compact className="lg:hidden" />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-10 gap-3 px-2 sm:px-3">
                                <span className="grid size-7 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">{user.name.slice(0, 1).toUpperCase()}</span>
                                <span className="hidden text-left sm:block"><span className="block max-w-40 truncate text-xs font-medium">{user.name}</span><span className="block text-[10px] capitalize text-muted-foreground">{user.role}</span></span>
                                <ChevronDown className="size-3.5 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel><span className="block truncate">{user.name}</span><span className="block truncate text-xs font-normal text-muted-foreground">{user.email}</span></DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild><Link href="/logout" method="post" as="button" className="w-full"><LogOut />Log out</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>

                <main className="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
                    <div className="mx-auto max-w-6xl animate-rise-in">
                        <div className="flex flex-col gap-5 border-b pb-7 sm:flex-row sm:items-end sm:justify-between">
                            <div><div className="mb-3 flex items-center gap-2"><Badge variant="secondary">{user.role}</Badge><span className="text-xs text-muted-foreground">Authenticated workspace</span></div><h1 className="text-3xl font-semibold tracking-[-0.03em]">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p></div>
                            {actions && <div className="shrink-0">{actions}</div>}
                        </div>
                        <div className="py-8">{children}</div>
                    </div>
                </main>
            </div>
        </div>
    );
}
