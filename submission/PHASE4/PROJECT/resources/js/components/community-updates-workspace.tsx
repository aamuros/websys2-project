import { router, useForm, usePage } from '@inertiajs/react';
import { BookOpen, CalendarDays, Megaphone, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FilterSelect, FormDialog, Pagination, StatusBadge, fieldClass, textareaClass, type Paginated } from '@/components/workspace-ui';
import { WorkspaceSearch } from '@/components/workspace-search';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

export type CommunityUpdate = {
    id: number;
    title: string;
    body: string;
    status: 'draft' | 'published' | 'archived';
    published_at: string | null;
    creator: { name: string };
};

export type UpdateFilters = { search?: string; status?: string; sort: 'newest' | 'oldest' };

function publicationLabel(update: CommunityUpdate) {
    if (update.status === 'draft') return 'Not yet published';
    if (!update.published_at) return 'Publication date not recorded';
    return `${update.status === 'archived' ? 'Last published' : 'Published'} ${new Date(update.published_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export function CommunityUpdatesWorkspace({ updates, filters }: {
    updates: Paginated<CommunityUpdate>;
    filters: UpdateFilters;
}) {
    const role = usePage<SharedPageProps>().props.auth.user!.role;
    const canManage = role === 'staff' || role === 'admin';
    const [query, setQuery] = useState(filters.search ?? '');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingUpdate, setEditingUpdate] = useState<CommunityUpdate | null>(null);
    const form = useForm({ title: '', body: '', status: 'draft' as 'draft' | 'published' });
    const actionForm = useForm({});
    const selectedUpdate = updates.data.find((update) => update.id === selectedId);
    const hasSearch = Boolean(filters.search?.trim());
    const hasFilters = hasSearch || (canManage && Boolean(filters.status));

    function loadUpdates(sort = filters.sort, search = query.trim(), status = filters.status) {
        router.get('/community-updates', { sort, ...(search && { search }), ...(canManage && status && { status }) }, { preserveState: true, preserveScroll: true, replace: true });
    }

    function editUpdate(update?: CommunityUpdate) {
        setEditingUpdate(update ?? null);
        form.setData({ title: update?.title ?? '', body: update?.body ?? '', status: update?.status === 'published' ? 'published' : 'draft' });
        form.clearErrors();
        setEditorOpen(true);
    }

    function saveUpdate() {
        const options = { preserveScroll: true, onSuccess: () => setEditorOpen(false) };
        if (editingUpdate) form.put(`/community-updates/${editingUpdate.id}`, options);
        else form.post('/community-updates', options);
    }

    function changeStatus(update: CommunityUpdate, action: 'publish' | 'archive') {
        actionForm.post(`/community-updates/${update.id}/${action}`, { preserveScroll: true });
    }

    return (
        <AppLayout
            title="Community updates"
            description="Read news and announcements from the garden team."
            actions={(
                <div className="flex flex-wrap items-center gap-2">
                    <WorkspaceSearch value={query} onChange={setQuery} label="Search update titles and content" placeholder="Search community updates" onSubmit={() => loadUpdates()} onClear={() => loadUpdates(filters.sort, '')} className="sm:w-[280px]" />
                    {canManage && <Button size="sm" disabled={actionForm.processing} onClick={() => editUpdate()}><Plus aria-hidden="true" />New update</Button>}
                </div>
            )}
        >
            <div className="space-y-6 pb-9">
                <section aria-labelledby="published-updates-title">
                    <h2 id="published-updates-title" className="sr-only">{hasSearch ? 'Search results' : canManage ? 'Community updates' : 'Published updates'}</h2>
                    <div className="mb-[18px] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
                        <div className="flex flex-wrap items-center gap-2">
                            {canManage && <FilterSelect label="Status" value={filters.status} options={[["draft", "Draft"], ["published", "Published"], ["archived", "Archived"]]} onChange={(status) => loadUpdates(filters.sort, query.trim(), status)} />}
                            <div className="flex items-center gap-1" role="group" aria-label="Sort updates by publication date">
                            {(['newest', 'oldest'] as const).map((sort) => (
                                <button
                                    key={sort}
                                    type="button"
                                    aria-pressed={filters.sort === sort}
                                    onClick={() => loadUpdates(sort)}
                                    className={cn('h-9 whitespace-nowrap rounded-full px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-primary/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50', filters.sort === sort && 'bg-primary/[0.09] font-semibold text-foreground')}
                                >
                                    {sort === 'newest' ? 'Newest first' : 'Oldest first'}
                                </button>
                            ))}
                            </div>
                        </div>
                    </div>

                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <p role="status" className="text-sm text-muted-foreground">{updates.total} {hasFilters ? 'matching' : canManage ? '' : 'published'} {updates.total === 1 ? 'update' : 'updates'}</p>
                        {hasSearch && <button type="button" onClick={() => { setQuery(''); loadUpdates(filters.sort, ''); }} className="rounded-sm text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">Clear search</button>}
                    </div>

                    {updates.data.length ? (
                        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(64,79,29,0.05)]">
                            <ul className="divide-y divide-border">
                                {updates.data.map((update) => (
                                    <li key={update.id}>
                                        <article className="p-5 sm:p-6" aria-labelledby={`update-title-${update.id}`}>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                <StatusBadge value={update.status} />
                                                <p className="flex items-center gap-1.5"><CalendarDays className="size-3.5" aria-hidden="true" />{publicationLabel(update)}</p>
                                                <p>By {update.creator.name}</p>
                                            </div>
                                            <h3 id={`update-title-${update.id}`} className="mt-3 break-words text-lg font-bold leading-7 tracking-[-0.02em] text-foreground">{update.title}</h3>
                                            <p className="mt-2 line-clamp-3 max-w-3xl whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{update.body}</p>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <Button variant="outline" size="sm" className="rounded-xl" aria-label={`Read update: ${update.title}`} onClick={() => setSelectedId(update.id)}>Read update<BookOpen aria-hidden="true" /></Button>
                                                {canManage && <>
                                                    <Button variant="outline" size="sm" disabled={actionForm.processing} onClick={() => editUpdate(update)}>Edit</Button>
                                                    {update.status === 'draft' && <Button size="sm" disabled={actionForm.processing} onClick={() => changeStatus(update, 'publish')}>Publish</Button>}
                                                    {update.status !== 'archived' && <Button variant="ghost" size="sm" disabled={actionForm.processing} onClick={() => changeStatus(update, 'archive')}>Archive</Button>}
                                                </>}
                                            </div>
                                        </article>
                                    </li>
                                ))}
                            </ul>
                            <Pagination page={updates} />
                        </div>
                    ) : (
                        <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-border bg-card/55 px-5 py-10 text-center">
                            <div className="max-w-md">
                                <span className="mx-auto grid size-12 place-items-center rounded-xl bg-primary/[0.08] text-primary">{hasFilters ? <Search className="size-5" aria-hidden="true" /> : <Megaphone className="size-5" aria-hidden="true" />}</span>
                                <h3 className="mt-4 text-base font-bold">{hasFilters ? 'No matching updates' : 'No community updates yet'}</h3>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">{hasFilters ? 'Try another title, topic, keyword, or status.' : canManage ? 'Create an update to share news with the garden community.' : 'Published news and announcements from the garden team will appear here.'}</p>
                                {hasSearch && <Button variant="outline" className="mt-5 rounded-xl" onClick={() => { setQuery(''); loadUpdates(filters.sort, ''); }}>Clear search</Button>}
                            </div>
                        </div>
                    )}
                </section>
            </div>

            <Dialog open={Boolean(selectedUpdate)} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
                {selectedUpdate && (
                    <DialogContent className="max-h-[85dvh] max-w-2xl overflow-y-auto rounded-2xl bg-card">
                        <DialogHeader className="pr-6">
                            <DialogTitle className="break-words text-xl font-[750] leading-7 tracking-[-0.025em]">{selectedUpdate.title}</DialogTitle>
                            <DialogDescription>{publicationLabel(selectedUpdate)} · By {selectedUpdate.creator.name}</DialogDescription>
                        </DialogHeader>
                        <p className="whitespace-pre-wrap break-words border-t border-border pt-5 text-sm leading-7 text-foreground">{selectedUpdate.body}</p>
                        <DialogFooter className="border-t border-border pt-4"><Button variant="outline" className="rounded-xl" onClick={() => setSelectedId(null)}>Close</Button></DialogFooter>
                    </DialogContent>
                )}
            </Dialog>

            {canManage && <FormDialog open={editorOpen} onOpenChange={(open) => { if (!form.processing) setEditorOpen(open); }} title={editingUpdate ? 'Edit update' : 'Create update'} description="Write a clear update for the garden community." processing={form.processing} onSubmit={saveUpdate} className="max-h-[85dvh] max-w-2xl overflow-y-auto rounded-2xl bg-card">
                <Field label="Title" error={form.errors.title}><input className={fieldClass} maxLength={160} value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} /></Field>
                <Field label="Update" error={form.errors.body}><textarea className={textareaClass} maxLength={10000} value={form.data.body} onChange={(event) => form.setData('body', event.target.value)} /></Field>
                <Field label="Visibility" error={form.errors.status}><select className={fieldClass} value={form.data.status} onChange={(event) => form.setData('status', event.target.value as 'draft' | 'published')}><option value="draft">Save as draft</option><option value="published">Publish now</option></select></Field>
            </FormDialog>}
        </AppLayout>
    );
}
