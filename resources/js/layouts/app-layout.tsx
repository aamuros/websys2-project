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
    Menu,
    Megaphone,
    Settings,
    ShieldCheck,
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
import type { SharedPageProps } from '@/types';

const roleIcons = { member: Sprout, staff: UsersRound, admin: ShieldCheck };

const secondaryItems = [
    { label: 'Garden plots', icon: Map },
    { label: 'Plot requests', icon: ClipboardList },
];

const toolItems = [
    { label: 'Assignments', icon: ClipboardList },
    { label: 'Garden calendar', icon: CalendarDays },
    { label: 'Community updates', icon: Megaphone },
    { label: 'Reports', icon: FileChartColumn },
    { label: 'Members', icon: UsersRound },
];

function AccountMenu({ mobile = false }: { mobile?: boolean }) {
    const { auth } = usePage<SharedPageProps>().props;
    const user = auth.user!;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className={cn('flex h-9 min-w-0 items-center gap-2 rounded-lg px-2 text-left transition-colors hover:bg-primary/10', mobile ? 'max-w-[210px]' : 'w-[172px]')}>
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary">
                    {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium leading-5 text-foreground">{user.name}</span>
                </span>
                <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>
                    <span className="block truncate">{user.name}</span>
                    <span className="block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/logout" method="post" as="button" className="w-full"><LogOut />Log out</Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
    const { auth } = usePage<SharedPageProps>().props;
    const currentUrl = usePage().url;
    const user = auth.user!;
    const RoleIcon = roleIcons[user.role];
    const roleUrl = `/${user.role}/dashboard`;

    const itemClass = (active: boolean) => cn(
        'flex h-8 items-center gap-2 rounded-lg px-2 text-sm font-medium transition-all duration-150',
        active
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground',
    );

    return (
        <nav className="flex min-h-0 flex-1 flex-col" aria-label="Primary navigation">
            <div className="space-y-px py-2">
                <Link href="/dashboard" onClick={onNavigate} className={itemClass(currentUrl === '/dashboard')}>
                    <LayoutDashboard className="size-5" />Dashboard
                </Link>
                <Link href={roleUrl} onClick={onNavigate} className={itemClass(currentUrl === roleUrl)}>
                    <RoleIcon className="size-5" /><span className="capitalize">{user.role} workspace</span>
                </Link>
                {secondaryItems.map(({ label, icon: Icon }) => (
                    <span key={label} className="flex h-8 cursor-default items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground/70" title="Coming soon">
                        <Icon className="size-5" />{label}
                    </span>
                ))}
            </div>

            <div className="py-2">
                <p className="flex h-8 items-center px-2 text-xs font-semibold text-muted-foreground/70">Tools</p>
                <div className="space-y-px">
                    {toolItems.map(({ label, icon: Icon }) => (
                        <span key={label} className="flex h-9 cursor-default items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground/70" title="Coming soon">
                            <Icon className="size-5" />{label}
                        </span>
                    ))}
                </div>
            </div>

            <div className="mt-auto flex items-center justify-between px-2 pb-1 text-muted-foreground">
                <button type="button" className="grid size-9 place-items-center rounded-full transition-colors hover:bg-primary/10 hover:text-foreground" aria-label="Help" title="Help">
                    <CircleHelp className="size-[19px]" />
                </button>
                <button type="button" className="grid size-9 place-items-center rounded-full transition-colors hover:bg-primary/10 hover:text-foreground" aria-label="Settings" title="Settings">
                    <Settings className="size-[19px]" />
                </button>
            </div>
        </nav>
    );
}

function SidebarContent({ onNavigate, mobile = false }: { onNavigate?: () => void; mobile?: boolean }) {
    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex h-14 shrink-0 items-center justify-between gap-1 px-3 pb-1 pt-3">
                <AccountMenu mobile={mobile} />
                <button type="button" className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground" aria-label="Notifications">
                    <Bell className="size-[19px]" />
                </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col px-3">
                <Navigation onNavigate={onNavigate} />
            </div>
        </div>
    );
}

export function AppLayout({ title, description, actions, children }: PropsWithChildren<{ title: string; description: string; actions?: ReactNode }>) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background">
            <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center bg-primary px-4 text-primary-foreground lg:px-5">
                <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
                    <DialogTrigger asChild>
                        <button type="button" className="mr-3 grid size-9 place-items-center rounded-full transition-colors hover:bg-white/10 lg:hidden" aria-label="Open navigation">
                            <Menu className="size-5" />
                        </button>
                    </DialogTrigger>
                    <DialogContent className="left-0 top-14 h-[calc(100dvh-3.5rem)] w-[min(88vw,280px)] max-w-none translate-x-0 translate-y-0 rounded-none border-y-0 border-l-0 bg-background p-0" showCloseButton={false}>
                        <DialogTitle className="sr-only">Navigation</DialogTitle>
                        <SidebarContent mobile onNavigate={() => setMobileOpen(false)} />
                    </DialogContent>
                </Dialog>
                <Sprout className="size-5 stroke-[1.8]" aria-label="Community Garden" />
            </header>

            <aside className="fixed bottom-0 left-0 top-14 z-30 hidden w-[241px] border-r border-border/60 bg-background lg:block">
                <SidebarContent />
            </aside>

            <main className="min-h-screen pt-14 lg:pl-[241px]">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto flex h-[89px] max-w-[1151px] items-center justify-between gap-4 border-b border-border/40">
                        <div className="min-w-0">
                            <h1 className="truncate text-2xl font-semibold tracking-[-0.025em] text-foreground">{title}</h1>
                            <p className="sr-only">{description}</p>
                        </div>
                        {actions && <div className="shrink-0">{actions}</div>}
                    </div>
                    <div className="mx-auto max-w-[1151px] animate-rise-in py-10">{children}</div>
                </div>
            </main>
        </div>
    );
}
