import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { WorkspaceSearch } from '@/components/workspace-search';
import { Empty, WorkspacePanel, WorkspaceSection } from '@/components/workspace-ui';
import { AppLayout } from '@/layouts/app-layout';

export default function Help({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
    const [query, setQuery] = useState('');
    const topics = useMemo(() => faqs.filter(topic => `${topic.question} ${topic.answer}`.toLowerCase().includes(query.toLowerCase())), [query, faqs]);

    return (
        <>
            <Head title="Help center" />
            <AppLayout title="Help center" description="Guidance for using your community garden workspace." actions={<WorkspaceSearch value={query} onChange={setQuery} label="Search help" placeholder="Search help topics" className="sm:w-72" />}>
                <div className="space-y-8 pb-9">
                    <WorkspaceSection title={query ? 'Search results' : 'Frequently asked questions'} description={`${topics.length} ${topics.length === 1 ? 'topic' : 'topics'}${query ? ' matching your search' : ' to help you use the workspace'}.`}>
                        {topics.length === 0 ? <Empty message="No help topics match your search." /> : (
                            <WorkspacePanel>
                                <div className="divide-y divide-border">
                                    {topics.map(topic => (
                                        <article key={topic.question} className="p-5 sm:p-6">
                                            <h3 className="text-base font-bold tracking-[-0.02em]">{topic.question}</h3>
                                            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{topic.answer}</p>
                                        </article>
                                    ))}
                                </div>
                            </WorkspacePanel>
                        )}
                    </WorkspaceSection>
                </div>
            </AppLayout>
        </>
    );
}
