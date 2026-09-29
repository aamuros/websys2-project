import { Link, router, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { type PropsWithChildren, type ReactNode, useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WorkspaceSearch } from '@/components/workspace-search';
import { cn } from '@/lib/utils';

export type Paginated<T> = { data: T[]; current_page: number; last_page: number; prev_page_url: string | null; next_page_url: string | null; total: number };

export function WorkspaceSection({ title, description, actions, children }: PropsWithChildren<{ title: string; description?: string; actions?: ReactNode }>) {
    const headingId = useId();

    return <section aria-labelledby={headingId}>
        <h2 id={headingId} className="sr-only">{title}</h2>
        {(description || actions) && <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
            {description && <p className="text-sm leading-5 text-muted-foreground">{description}</p>}
            {actions}
        </div>}
        {children}
    </section>;
}

export function WorkspacePanel({ children, className }: PropsWithChildren<{ className?: string }>) {
    return <div className={cn('overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(64,79,29,0.05)]', className)}>{children}</div>;
}

export function Toolbar({ path, search = '', filters, actionLabel, onAction }: { path: string; search?: string; filters?: ReactNode; actionLabel?: string; onAction?: () => void }) {
    const { url } = usePage();
    const [value, setValue] = useState(search);
    useEffect(() => setValue(search), [search]);
    const submit = (searchValue = value) => {
        const query = new URLSearchParams(url.split('?')[1] ?? '');
        query.delete('page');
        if (searchValue.trim()) query.set('search', searchValue.trim());
        else query.delete('search');
        router.get(path, Object.fromEntries(query), { preserveState: true, preserveScroll: true, replace: true });
    };
    return <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <WorkspaceSearch value={value} onChange={setValue} label="Search this page" placeholder="Search" onSubmit={() => submit()} onClear={() => submit('')} className="min-w-48 flex-1 sm:w-[233px]" />
        {filters}
        {actionLabel && <Button size="sm" onClick={onAction}><Plus />{actionLabel}</Button>}
    </div>;
}

export function FilterSelect({ value = '', label, options, onChange }: { value?: string; label: string; options: Array<[string, string]>; onChange: (value: string) => void }) {
    return <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="h-9 max-w-full rounded-xl border border-input bg-card px-3 text-sm outline-none transition-colors focus:border-ring/60 focus:ring-2 focus:ring-ring/25"><option value="">All {label.toLowerCase()}</option>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select>;
}

export function StatusBadge({ value }: { value: string }) {
    const good = ['available', 'active', 'approved', 'published'].includes(value);
    const bad = ['rejected', 'suspended'].includes(value);
    const neutral = ['ended', 'cancelled', 'archived'].includes(value);
    return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize', good ? 'bg-primary/[0.09] text-primary' : bad ? 'bg-destructive/10 text-destructive' : neutral ? 'bg-secondary text-muted-foreground' : 'bg-amber-100 text-amber-900')}>{value}</span>;
}

export function Pagination({ page }: { page: Paginated<unknown> }) {
    if (page.last_page <= 1) return null;
    const linkClass = 'inline-flex h-9 items-center rounded-xl border border-border bg-background px-3 font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50';
    return <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 text-sm text-muted-foreground sm:px-6"><span>Page {page.current_page} of {page.last_page} · {page.total} items</span><div className="flex gap-2">{page.prev_page_url && <Link className={linkClass} href={page.prev_page_url}>Previous</Link>}{page.next_page_url && <Link className={linkClass} href={page.next_page_url}>Next</Link>}</div></nav>;
}

export function FormDialog({ open, onOpenChange, title, description, children, submitLabel = 'Save', processing, onSubmit, className }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; children: ReactNode; submitLabel?: string; processing?: boolean; onSubmit: () => void; className?: string }) {
    return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className={cn('max-h-[85dvh] overflow-y-auto rounded-2xl bg-card p-5 sm:p-6', className)}><DialogHeader className="pr-6"><DialogTitle className="text-xl font-[750] leading-7 tracking-[-0.025em]">{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><div className="space-y-5">{children}</div><DialogFooter className="border-t border-border pt-5"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={onSubmit} disabled={processing}>{processing ? 'Saving…' : submitLabel}</Button></DialogFooter></DialogContent></Dialog>;
}

export const fieldClass = 'h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring/60 focus:ring-2 focus:ring-ring/25';
export const textareaClass = 'min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring/60 focus:ring-2 focus:ring-ring/25';
export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) { return <label className="block space-y-1.5"><span className="text-sm font-medium">{label}</span>{children}{error && <span className="block text-sm text-destructive">{error}</span>}</label>; }
export function Empty({ message }: { message: string }) { return <div className="rounded-2xl border border-dashed border-border bg-card/55 px-5 py-12 text-center text-sm leading-6 text-muted-foreground">{message}</div>; }
