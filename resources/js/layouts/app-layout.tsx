import { Link, usePage } from '@inertiajs/react';
import {
    Bell,
    CalendarDays,
    ChevronDown,
    CircleHelp,
    ClipboardList,
    FileChartColumn,
    LayoutDashboard,
    LogOut,
    Map,
    Megaphone,
    Menu,
    Search,
    Settings,
    Sprout,
    UsersRound,
} from 'lucide-react';
import { useState, type PropsWithChildren, type ReactNode } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { QuickCreateDialog } from '@/components/quick-create-dialog';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

const navigationItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Garden plots', href: '/garden-plots', icon: Map },
    { label: 'Plot requests', href: '/plot-requests', icon: ClipboardList },
    { label: 'Assignments', href: '/assignments', icon: Sprout },
    { label: 'Garden calendar', href: '/garden-calendar', icon: CalendarDays },
    { label: 'Community updates', href: '/community-updates', icon: Megaphone },
    { label: 'Reports', href: '/reports', icon: FileChartColumn },
    { label: 'Members', href: '/members', icon: UsersRound },
];

const utilityItems = [
    { label: 'Help center', href: '/help', icon: CircleHelp },
    { label: 'Settings', href: '/settings', icon: Settings },
];

const navItemClass = (active: boolean) => cn(
    'flex h-8 items-center gap-2 rounded-[10px] px-2 text-sm font-medium transition-[background-color,color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
    active
        ? 'bg-primary/[0.075] font-semibold text-foreground'
        : 'text-muted-foreground hover:bg-primary/[0.07] hover:text-foreground active:translate-x-px',
);

function AccountMenu() {
    const { auth } = usePage<SharedPageProps>().props;
    const user = auth.user!;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex h-9 min-w-0 max-w-[188px] items-center gap-2 rounded-[9px] px-2 text-left transition-colors hover:bg-primary/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/[0.14] text-[9px] font-bold text-foreground">
                    {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
                    <span className="truncate text-sm font-medium tracking-[0.01em] text-muted-foreground">{user.name}</span>
                    <ChevronDown className="size-4 shrink-0 stroke-[1.8] text-muted-foreground" />
                </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={7} className="w-60 rounded-xl p-1.5">
                <DropdownMenuLabel className="px-2 py-2">
                    <span className="block truncate">{user.name}</span>
                    <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-lg">
                    <Link href="/settings"><Settings />Account settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg">
                    <Link href="/logout" method="post" as="button" className="w-full"><LogOut />Log out</Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
    const currentUrl = usePage().url.split('?')[0];
    const isActive = (href: string) => href === '/dashboard'
        ? currentUrl === href || currentUrl.endsWith('/dashboard')
        : currentUrl === href;

    return (
        <nav className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2" aria-label="Primary navigation">
            <div className="space-y-0.5 px-1 py-2">
                {navigationItems.map(({ label, href, icon: Icon }) => (
                    <Link key={href} href={href} onClick={onNavigate} className={navItemClass(isActive(href))} aria-current={isActive(href) ? 'page' : undefined}>
                        <Icon className="size-4 shrink-0 stroke-[1.9]" />
                        <span className="truncate">{label}</span>
                    </Link>
                ))}
            </div>

            <div className="min-h-2 flex-1" />

            <div className="space-y-0.5 px-1 py-2">
                {utilityItems.map(({ label, href, icon: Icon }) => (
                    <Link key={href} href={href} onClick={onNavigate} className={navItemClass(currentUrl === href)} aria-current={currentUrl === href ? 'page' : undefined}>
                        <Icon className="size-4 shrink-0 stroke-[1.9]" />
                        <span>{label}</span>
                    </Link>
                ))}
                <Link href="/logout" method="post" as="button" className={cn(navItemClass(false), 'w-full')}>
                    <LogOut className="size-4 shrink-0 stroke-[1.9]" />
                    <span>Log out</span>
                </Link>
            </div>

            <p className="shrink-0 px-6 pb-6 pt-1 text-[8px] leading-3 text-muted-foreground/60">© 2026 Community Garden</p>
        </nav>
    );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex h-[52px] shrink-0 items-center justify-between gap-1 px-3 py-2">
                <AccountMenu />
                <button type="button" className="grid size-9 shrink-0 place-items-center rounded-full text-foreground transition-colors hover:bg-primary/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" aria-label="Notifications" title="Notifications">
                    <Bell className="size-5 stroke-[1.8]" />
                </button>
            </div>
            <Navigation onNavigate={onNavigate} />
        </div>
    );
}

function DefaultPageActions() {
    return (
        <div className="flex w-full items-center gap-2 sm:w-auto" aria-label="Page actions">
            <label className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-[10px] border border-primary/10 bg-card/70 px-2.5 text-muted-foreground shadow-[0_1px_2px_rgba(64,79,29,0.04)] sm:w-52 sm:flex-none">
                <Search className="size-4 shrink-0" aria-hidden="true" />
                <input type="search" placeholder="Search" aria-label="Search this page" className="h-[30px] min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-muted-foreground/70" />
            </label>
            <QuickCreateDialog />
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex min-h-[calc(100dvh-220px)] items-center justify-center pb-16 sm:min-h-[calc(100dvh-188px)]">
            <div className="max-w-sm text-center">
                <span className="mx-auto grid size-11 place-items-center rounded-full bg-primary/[0.08] text-primary">
                    <Sprout className="size-5 stroke-[1.8]" />
                </span>
                <h2 className="mt-4 text-base font-semibold text-foreground">Nothing here yet</h2>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">Use New to add the first item to this page.</p>
            </div>
        </div>
    );
}

export function AppLayout({ title, description, actions, children }: PropsWithChildren<{ title: string; description: string; actions?: ReactNode }>) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="h-dvh min-h-[480px] overflow-hidden bg-primary">
            <header className="fixed inset-x-0 top-0 z-40 flex h-12 items-center justify-between bg-primary px-5 text-primary-foreground">
                <img
                    src="/images/community-garden-logo.png"
                    alt="Community Garden"
                    className="size-7 object-contain"
                />
                <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
                    <DialogTrigger asChild>
                        <button type="button" className="grid size-9 place-items-center rounded-full transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 lg:hidden" aria-label="Open navigation">
                            <Menu className="size-5" />
                        </button>
                    </DialogTrigger>
                    <DialogContent className="left-0 top-[52px] h-[calc(100dvh-52px)] w-[min(88vw,256px)] max-w-none translate-x-0 translate-y-0 rounded-none rounded-tr-3xl border-y-0 border-l-0 bg-background p-0 shadow-2xl" showCloseButton={false}>
                        <DialogTitle className="sr-only">Navigation</DialogTitle>
                        <SidebarContent onNavigate={() => setMobileOpen(false)} />
                    </DialogContent>
                </Dialog>
            </header>

            <div className="fixed inset-x-0 bottom-0 top-[52px] overflow-hidden rounded-t-3xl bg-background shadow-[0_-1px_0_rgba(255,255,255,0.04)]">
                <aside className="absolute inset-y-0 left-0 z-30 hidden w-64 border-r border-border/60 bg-background lg:block">
                    <SidebarContent />
                </aside>

                <main className="app-scrollbar h-full overflow-y-auto overscroll-contain bg-background px-4 sm:px-6 lg:px-10 lg:pl-[296px]">
                    <div className="mx-auto flex min-h-24 w-full max-w-[1151px] flex-col justify-center gap-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:py-6">
                        <div className="min-w-0 flex-1 sm:pr-4">
                            <h1 className="text-xl font-semibold leading-7 tracking-[-0.0175em] text-foreground">{title}</h1>
                            <p className="text-sm leading-5 text-muted-foreground">{description}</p>
                        </div>
                        <div className="w-full shrink-0 sm:w-auto">{actions ?? <DefaultPageActions />}</div>
                    </div>
                    <div className="mx-auto w-full max-w-[1151px] animate-rise-in">{children ?? <EmptyState />}</div>
                </main>
            </div>
        </div>
    );
}
