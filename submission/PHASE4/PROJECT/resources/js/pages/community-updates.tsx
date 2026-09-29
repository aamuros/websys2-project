import { Head } from '@inertiajs/react';
import { CommunityUpdatesWorkspace, type CommunityUpdate, type UpdateFilters } from '@/components/community-updates-workspace';
import type { Paginated } from '@/components/workspace-ui';

export default function CommunityUpdates({ updates, filters }: {
    updates: Paginated<CommunityUpdate>;
    filters: UpdateFilters;
}) {
    return <><Head title="Community updates" /><CommunityUpdatesWorkspace updates={updates} filters={filters} /></>;
}
