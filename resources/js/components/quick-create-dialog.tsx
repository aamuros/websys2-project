import { router, usePage } from '@inertiajs/react';
import {
    ClipboardList,
    Map,
    Megaphone,
    Plus,
    Sprout,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { SharedPageProps, UserRole } from '@/types';

type QuickCreateKind = 'garden-plot' | 'plot-request' | 'assignment' | 'community-update';

const quickCreateOptions = [
    {
        kind: 'garden-plot' as const,
        label: 'Garden plot',
        workspace: 'Garden plots',
        href: '/garden-plots',
        icon: Map,
        description: 'Register a bed or growing space so it can be requested and assigned.',
    },
    {
        kind: 'plot-request' as const,
        label: 'Plot request',
        workspace: 'Plot requests',
        href: '/plot-requests',
        icon: ClipboardList,
        description: 'Record a member request for an available garden plot.',
    },
    {
        kind: 'assignment' as const,
        label: 'Assignment',
        workspace: 'Assignments',
        href: '/assignments',
        icon: Sprout,
        description: 'Connect a member with a plot and track the active allocation.',
    },
    {
        kind: 'community-update' as const,
        label: 'Community update',
        workspace: 'Community updates',
        href: '/community-updates',
        icon: Megaphone,
        description: 'Publish an announcement for gardeners and volunteers.',
    },
];

const roleLabels: Record<UserRole, string> = {
    admin: 'Administrator',
    staff: 'Staff',
    member: 'Member',
};

function defaultKindForPath(path: string): QuickCreateKind {
    if (path === '/garden-plots') return 'garden-plot';
    if (path === '/plot-requests') return 'plot-request';
    if (path === '/assignments') return 'assignment';
    if (path === '/community-updates') return 'community-update';

    return 'plot-request';
}

function ContextField({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-medium leading-4 text-foreground">{label}</span>
            <div className="flex h-8 items-center rounded-[10px] border border-primary/10 bg-card/75 px-[11px] text-sm text-foreground shadow-[0_1px_2px_rgba(64,79,29,0.04)]">
                <span className="truncate">{value}</span>
            </div>
        </div>
    );
}

export function QuickCreateDialog() {
    const { auth } = usePage<SharedPageProps>().props;
    const currentPath = usePage().url.split('?')[0];
    const defaultKind = defaultKindForPath(currentPath);
    const [open, setOpen] = useState(false);
    const [selectedKind, setSelectedKind] = useState<QuickCreateKind>(defaultKind);

    const selectedOption = useMemo(
        () => quickCreateOptions.find((option) => option.kind === selectedKind)!,
        [selectedKind],
    );

    const user = auth.user;

    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen) {
            setSelectedKind(defaultKind);
        }

        setOpen(nextOpen);
    };

    const continueToWorkspace = () => {
        setOpen(false);
        router.visit(selectedOption.href);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="inline-flex h-8 shrink-0 items-center gap-2 rounded-[10px] border border-primary bg-primary px-2.5 text-sm font-medium text-primary-foreground shadow-[0_1px_1px_rgba(64,79,29,0.14)] transition-[background-color,transform] hover:-translate-y-px hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                    <Plus className="size-4" />
                    <span>New</span>
                </button>
            </DialogTrigger>

            <DialogContent
                showCloseButton={false}
                className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[672px] gap-0 overflow-hidden rounded-2xl border-border/70 bg-popover p-0 shadow-[0_20px_60px_rgba(64,79,29,0.22)]"
            >
                <DialogHeader className="gap-2 px-6 pb-3 pt-6 text-left">
                    <DialogTitle className="text-xl font-semibold leading-5 tracking-[-0.015em] text-foreground">
                        Create something new
                    </DialogTitle>
                    <DialogDescription className="text-sm leading-5 text-muted-foreground">
                        Choose what you want to add to the community garden workspace.
                    </DialogDescription>
                </DialogHeader>

                <div className="app-scrollbar max-h-[536px] overflow-y-auto px-6 pb-6 pt-1">
                    <div className="flex flex-col gap-6">
                        <ContextField label="Item type" value={selectedOption.label} />
                        <ContextField label="Created by" value={user?.name ?? 'Community Garden user'} />
                        <ContextField
                            label="Destination"
                            value={`${selectedOption.workspace} · ${user ? roleLabels[user.role] : 'Member'} workspace`}
                        />

                        <fieldset>
                            <legend className="sr-only">Choose what to create</legend>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {quickCreateOptions.map((option) => {
                                    const Icon = option.icon;
                                    const selected = option.kind === selectedKind;

                                    return (
                                        <button
                                            key={option.kind}
                                            type="button"
                                            role="radio"
                                            aria-checked={selected}
                                            onClick={() => setSelectedKind(option.kind)}
                                            className={cn(
                                                'relative min-h-32 rounded-[10px] border p-3 pr-10 text-left transition-[background-color,border-color,transform,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                                                selected
                                                    ? 'border-primary/25 bg-primary/[0.055] shadow-[0_1px_2px_rgba(64,79,29,0.05)]'
                                                    : 'border-border/70 bg-card/55 hover:-translate-y-px hover:border-primary/20 hover:bg-card',
                                            )}
                                        >
                                            <span className="relative mb-3 ml-1 block size-9" aria-hidden="true">
                                                <span className="absolute left-[-6px] top-[3px] size-[30px] -rotate-[10deg] rounded-[7px] border border-border/70 bg-transparent" />
                                                <span className="absolute left-[12px] top-[3px] size-[30px] rotate-[10deg] rounded-[7px] border border-border/70 bg-transparent" />
                                                <span className="absolute inset-0 grid size-9 place-items-center rounded-lg border border-border/80 bg-popover shadow-[0_1px_3px_rgba(64,79,29,0.06)]">
                                                    <Icon className="size-[18px] stroke-[1.8] text-foreground" />
                                                </span>
                                            </span>

                                            <span className="block text-sm font-medium leading-5 text-foreground">
                                                {option.label}
                                            </span>
                                            <span className="mt-0.5 block text-xs leading-4 text-muted-foreground">
                                                {option.description}
                                            </span>

                                            <span
                                                className={cn(
                                                    'absolute right-3 top-3 grid size-4 place-items-center rounded-full border',
                                                    selected
                                                        ? 'border-primary/50 bg-primary/[0.08]'
                                                        : 'border-primary/20 bg-card/80',
                                                )}
                                                aria-hidden="true"
                                            >
                                                <span
                                                    className={cn(
                                                        'size-1.5 rounded-full bg-primary transition-opacity',
                                                        selected ? 'opacity-100' : 'opacity-0',
                                                    )}
                                                />
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </fieldset>
                    </div>
                </div>

                <DialogFooter className="flex-row justify-end gap-2 border-t border-border/70 bg-card/65 px-6 py-4">
                    <DialogClose asChild>
                        <button
                            type="button"
                            className="inline-flex h-8 items-center justify-center rounded-[10px] border border-border bg-background px-3 text-sm font-medium text-foreground shadow-[0_1px_2px_rgba(64,79,29,0.04)] transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                        >
                            Close
                        </button>
                    </DialogClose>
                    <button
                        type="button"
                        onClick={continueToWorkspace}
                        className="inline-flex h-8 items-center justify-center rounded-[10px] border border-primary bg-primary px-3 text-sm font-medium text-primary-foreground shadow-[0_1px_1px_rgba(64,79,29,0.14)] transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                        Continue
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
