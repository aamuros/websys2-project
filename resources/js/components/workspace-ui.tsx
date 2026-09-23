import { Link, router } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type Paginated<T> = { data: T[]; current_page: number; last_page: number; prev_page_url: string | null; next_page_url: string | null; total: number };

export function Toolbar({ path, search = '', filters, actionLabel, onAction }: { path: string; search?: string; filters?: ReactNode; actionLabel?: string; onAction?: () => void }) {
    const [value, setValue] = useState(search);
    const submit = () => router.get(path, { search: value }, { preserveState: true, replace: true });
    return <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <label className="flex h-9 min-w-48 flex-1 items-center gap-2 rounded-lg border bg-card px-3"><Search className="size-4 text-muted-foreground" /><input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="Search" className="min-w-0 flex-1 bg-transparent text-sm outline-none" aria-label="Search this page" /></label>
        {filters}
        {actionLabel && <Button size="sm" onClick={onAction}><Plus />{actionLabel}</Button>}
    </div>;
}

export function FilterSelect({ value = '', label, options, onChange }: { value?: string; label: string; options: Array<[string, string]>; onChange: (value: string) => void }) {
    return <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="h-9 rounded-lg border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/25"><option value="">All {label.toLowerCase()}</option>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select>;
}

export function StatusBadge({ value }: { value: string }) {
    const good = ['available', 'active', 'approved', 'published'].includes(value);
    const bad = ['rejected', 'cancelled', 'suspended', 'archived'].includes(value);
    return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize', good ? 'bg-emerald-100 text-emerald-800' : bad ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800')}>{value}</span>;
}

export function Pagination({ page }: { page: Paginated<unknown> }) {
    if (page.last_page <= 1) return null;
    return <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground"><span>Page {page.current_page} of {page.last_page} · {page.total} items</span><div className="flex gap-2">{page.prev_page_url && <Link className="rounded-md border px-3 py-1.5 hover:bg-muted" href={page.prev_page_url}>Previous</Link>}{page.next_page_url && <Link className="rounded-md border px-3 py-1.5 hover:bg-muted" href={page.next_page_url}>Next</Link>}</div></div>;
}

export function FormDialog({ open, onOpenChange, title, description, children, submitLabel = 'Save', processing, onSubmit, className }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; children: ReactNode; submitLabel?: string; processing?: boolean; onSubmit: () => void; className?: string }) {
    return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className={className}><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><div className="space-y-4">{children}</div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={onSubmit} disabled={processing}>{processing ? 'Saving…' : submitLabel}</Button></DialogFooter></DialogContent></Dialog>;
}

export const fieldClass = 'h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/25';
export const textareaClass = 'min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/25';
export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) { return <label className="block space-y-1.5"><span className="text-sm font-medium">{label}</span>{children}{error && <span className="block text-sm text-destructive">{error}</span>}</label>; }
export function Empty({ message }: { message: string }) { return <div className="rounded-2xl border border-dashed bg-card/40 p-12 text-center text-sm text-muted-foreground">{message}</div>; }
