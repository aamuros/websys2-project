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
import { cn } from '@/lib/utils';
import type { SharedPageProps, UserRole } from '@/types';

const navigationItems: Array<{
    label: string;
    memberLabel?: string;
    href: string;
    icon: typeof LayoutDashboard;
    roles: UserRole[];
}> = [
    { label: 'Garden plots', href: '/garden-plots', icon: Map, roles: ['member', 'staff', 'admin'] },
    { label: 'Plot requests', memberLabel: 'My plot requests', href: '/plot-requests', icon: ClipboardList, roles: ['member', 'staff', 'admin'] },
    { label: 'Assignments', memberLabel: 'My assignments', href: '/assignments', icon: Sprout, roles: ['member', 'staff', 'admin'] },
    { label: 'Garden calendar', href: '/garden-calendar', icon: CalendarDays, roles: ['member', 'staff', 'admin'] },
    { label: 'Community updates', href: '/community-updates', icon: Megaphone, roles: ['member', 'staff', 'admin'] },
    { label: 'Reports', href: '/reports', icon: FileChartColumn, roles: ['staff', 'admin'] },
    { label: 'Members', href: '/members', icon: UsersRound, roles: ['admin'] },
];

const utilityItems = [
    { label: 'Help center', href: '/help', icon: CircleHelp },
    { label: 'Settings', href: '/settings', icon: Settings },
];

const navItemClass = (active: boolean) => cn(
    'flex h-8 items-center gap-2 rounded-[10px] px-2 text-sm font-medium transition-[background-color,color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
    active
        ? 'bg-primary/[0.075] font-[650] text-foreground'
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
                    <span className="truncate text-sm font-semibold tracking-[0.01em] text-muted-foreground">{user.name}</span>
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

function NotificationMenu() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="relative grid size-9 shrink-0 place-items-center rounded-full text-foreground transition-colors hover:bg-primary/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" aria-label="Open notifications">
                <Bell className="size-5 stroke-[1.8]" />
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary ring-2 ring-background" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={7} className="w-64 rounded-xl border-border/60 p-1.5 shadow-lg">
                <DropdownMenuLabel className="px-2 py-1.5">
                    <span className="block text-sm text-foreground">Notifications</span>
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground">2 garden updates</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/60" />
                <DropdownMenuItem asChild className="items-start gap-2 rounded-lg py-2 focus:bg-primary/[0.07]">
                    <Link href="/community-updates">
                        <Megaphone className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span><span className="block text-xs font-semibold text-foreground">Watering hours changed</span><span className="mt-0.5 block text-xs text-muted-foreground">View community update</span></span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="items-start gap-2 rounded-lg py-2 focus:bg-primary/[0.07]">
                    <Link href="/garden-calendar">
                        <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span><span className="block text-xs font-semibold text-foreground">Community workday</span><span className="mt-0.5 block text-xs text-muted-foreground">View garden calendar</span></span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
    const { auth } = usePage<SharedPageProps>().props;
    const role = auth.user!.role;
    const currentUrl = usePage().url.split('?')[0];
    const dashboardHref = `/${role}/dashboard`;
    const isActive = (href: string) => currentUrl === href;

    return (
        <nav className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2" aria-label="Primary navigation">
            <div className="space-y-0.5 px-1 py-2">
                <Link href={dashboardHref} onClick={onNavigate} className={navItemClass(isActive(dashboardHref))} aria-current={isActive(dashboardHref) ? 'page' : undefined}>
                    <LayoutDashboard className="size-4 shrink-0 stroke-[1.9]" />
                    <span className="truncate">Dashboard</span>
                </Link>
                {navigationItems.filter((item) => item.roles.includes(role)).map(({ label, memberLabel, href, icon: Icon }) => (
                    <Link key={href} href={href} onClick={onNavigate} className={navItemClass(isActive(href))} aria-current={isActive(href) ? 'page' : undefined}>
                        <Icon className="size-4 shrink-0 stroke-[1.9]" />
                        <span className="truncate">{role === 'member' && memberLabel ? memberLabel : label}</span>
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
                <NotificationMenu />
            </div>
            <Navigation onNavigate={onNavigate} />
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex min-h-[calc(100dvh-220px)] items-center justify-center pb-16 sm:min-h-[calc(100dvh-188px)]">
            <div className="w-full max-w-sm text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary/[0.08] text-primary">
                    <Sprout className="size-6 stroke-[1.8]" />
                </span>
                <h2 className="mt-5 text-lg font-[750] tracking-[-0.015em] text-foreground">Nothing here yet</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Content for this workspace will appear here when it becomes available.</p>
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
                    <div className="mx-auto flex min-h-[89px] w-full max-w-[1151px] flex-col justify-center gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
                        <div className="min-w-0 flex-1 sm:pr-4">
                            <h1 className="text-2xl font-[750] leading-[30px] tracking-[-0.01875em] text-foreground">{title}</h1>
                            <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
                        </div>
                        {actions && <div className="w-full shrink-0 sm:w-auto">{actions}</div>}
                    </div>
                    <div className="mx-auto w-full max-w-[1151px] animate-rise-in">{children ?? <EmptyState />}</div>
                </main>
            </div>
        </div>
    );
}
