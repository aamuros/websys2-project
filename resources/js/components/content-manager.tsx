import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Clock3, MapPin, Megaphone } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Empty, Field, FilterSelect, FormDialog, Pagination, type Paginated, StatusBadge, Toolbar, WorkspacePanel, WorkspaceSection, fieldClass, textareaClass } from '@/components/workspace-ui';
import { AppLayout } from '@/layouts/app-layout';
import type { SharedPageProps } from '@/types';

export type ContentItem = {
    id: number;
    title: string;
    status: string;
    description?: string | null;
    body?: string | null;
    location?: string | null;
    starts_at?: string;
    ends_at?: string;
    published_at?: string | null;
    creator: { name: string };
};
export type ContentFilters = { search?: string; status?: string };

function dateTimeLabel(value: string) {
    return new Date(value).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function localDateTimeValue(value?: string) {
    if (!value) return '';
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function ContentManager({ kind, items, filters }: {
    kind: 'event' | 'update';
    items: Paginated<ContentItem>;
    filters: ContentFilters;
}) {
    const plural = kind === 'event' ? 'garden-calendar' : 'community-updates';
    const path = `/${plural}`;
    const role = usePage<SharedPageProps>().props.auth.user!.role;
    const operations = role !== 'member';
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<ContentItem | null>(null);
    const form = useForm({ title: '', description: '', body: '', location: '', starts_at: '', ends_at: '', status: 'draft' });

    function edit(item?: ContentItem) {
        form.clearErrors();
        setSelected(item ?? null);
        form.setData({
            title: item?.title ?? '',
            description: item?.description ?? '',
            body: item?.body ?? '',
            location: item?.location ?? '',
            starts_at: localDateTimeValue(item?.starts_at),
            ends_at: localDateTimeValue(item?.ends_at),
            status: item?.status === 'published' ? 'published' : 'draft',
        });
        setOpen(true);
    }

    function save() {
        form.transform(data => kind === 'event' ? {
            ...data,
            starts_at: data.starts_at ? new Date(data.starts_at).toISOString() : '',
            ends_at: data.ends_at ? new Date(data.ends_at).toISOString() : '',
        } : data);
        const options = { onSuccess: () => setOpen(false) };
        if (selected) form.put(`${path}/${selected.id}`, options);
        else form.post(path, options);
    }

    const title = kind === 'event' ? 'Garden calendar' : 'Community updates';

    return (
        <>
            <Head title={title} />
            <AppLayout
                title={title}
                description={kind === 'event' ? 'Upcoming events, maintenance, and shared work days.' : 'News and announcements from the garden team.'}
                actions={<div className="flex flex-wrap items-center gap-2">{kind === 'event' && <Button asChild variant="outline" size="sm"><Link href="/garden-calendar">Open calendar and forecasts</Link></Button>}<Toolbar path={path} search={filters.search} actionLabel={operations ? `New ${kind}` : undefined} onAction={() => edit()} /></div>}
            >
                <div className="space-y-8 pb-9">
                    <WorkspaceSection
                        title={kind === 'event' ? 'Event schedule' : 'Community updates'}
                        description={`${items.total} ${kind === 'event' ? 'events' : 'updates'} matching the current filters.`}
                        actions={operations ? <FilterSelect label="Status" value={filters.status} options={['draft', 'published', 'archived'].map(value => [value, value])} onChange={status => router.get(path, { ...(kind === 'event' && { view: 'manage' }), ...filters, status }, { preserveState: true })} /> : undefined}
                    >
                        {items.data.length === 0 ? <Empty message={`No ${kind}s found.`} /> : (
                            <WorkspacePanel>
                                <ul className="divide-y divide-border">
                                    {items.data.map(item => (
                                        <li key={item.id}>
                                            <article className="flex items-start gap-3.5 p-5 sm:p-6" aria-labelledby={`content-title-${item.id}`}>
                                                {kind === 'event' && item.starts_at ? (
                                                    <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/[0.055]" aria-hidden="true">
                                                        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{new Date(item.starts_at).toLocaleDateString('en-PH', { month: 'short' })}</span>
                                                        <span className="text-lg font-bold leading-5">{new Date(item.starts_at).getDate()}</span>
                                                    </span>
                                                ) : (
                                                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/[0.08] text-primary"><Megaphone className="size-5" aria-hidden="true" /></span>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <StatusBadge value={item.status} />
                                                    <h3 id={`content-title-${item.id}`} className="mt-2 break-words text-lg font-bold leading-7 tracking-[-0.02em]">{item.title}</h3>
                                                    {kind === 'event' ? (
                                                        <>
                                                            {item.starts_at && <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-muted-foreground"><Clock3 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /><span>{dateTimeLabel(item.starts_at)}{item.ends_at && ` – ${dateTimeLabel(item.ends_at)}`}</span></p>}
                                                            <p className="mt-1 flex items-start gap-1.5 text-xs leading-5 text-muted-foreground"><MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />{item.location || 'Location to be announced'}</p>
                                                        </>
                                                    ) : (
                                                        <p className="mt-2 text-xs leading-5 text-muted-foreground">By {item.creator.name}{item.published_at && ` · ${new Date(item.published_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}`}</p>
                                                    )}
                                                    <p className="mt-3 line-clamp-4 whitespace-pre-line break-words text-sm leading-6 text-muted-foreground">{item.description ?? item.body}</p>
                                                    {operations && (
                                                        <div className="mt-4 flex flex-wrap gap-2">
                                                            <Button size="sm" variant="outline" onClick={() => edit(item)}>Edit</Button>
                                                            {item.status === 'draft' && <Button size="sm" onClick={() => router.post(`${path}/${item.id}/publish`)}>Publish</Button>}
                                                            {item.status !== 'archived' && <Button size="sm" variant="ghost" onClick={() => router.post(`${path}/${item.id}/archive`)}>Archive</Button>}
                                                        </div>
                                                    )}
                                                </div>
                                            </article>
                                        </li>
                                    ))}
                                </ul>
                                <Pagination page={items} />
                            </WorkspacePanel>
                        )}
                    </WorkspaceSection>
                </div>
            </AppLayout>
            <FormDialog open={open} onOpenChange={setOpen} title={`${selected ? 'Edit' : 'Create'} ${kind}`} description={kind === 'event' ? 'Add event details and save as a draft or publish it.' : 'Write a clear update for the garden community.'} processing={form.processing} onSubmit={save}>
                <Field label="Title" error={form.errors.title}><input className={fieldClass} value={form.data.title} onChange={event => form.setData('title', event.target.value)} /></Field>
                {kind === 'event' ? (
                    <>
                        <Field label="Description" error={form.errors.description}><textarea className={textareaClass} value={form.data.description} onChange={event => form.setData('description', event.target.value)} /></Field>
                        <Field label="Location" error={form.errors.location}><input className={fieldClass} value={form.data.location} onChange={event => form.setData('location', event.target.value)} /></Field>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Starts" error={form.errors.starts_at}><input type="datetime-local" className={fieldClass} value={form.data.starts_at} onChange={event => form.setData('starts_at', event.target.value)} /></Field>
                            <Field label="Ends" error={form.errors.ends_at}><input type="datetime-local" className={fieldClass} value={form.data.ends_at} onChange={event => form.setData('ends_at', event.target.value)} /></Field>
                        </div>
                    </>
                ) : <Field label="Update" error={form.errors.body}><textarea className={textareaClass} value={form.data.body} onChange={event => form.setData('body', event.target.value)} /></Field>}
                <Field label="Visibility" error={form.errors.status}><select className={fieldClass} value={form.data.status} onChange={event => form.setData('status', event.target.value)}><option value="draft">Save as draft</option><option value="published">Publish now</option></select></Field>
            </FormDialog>
        </>
    );
}
