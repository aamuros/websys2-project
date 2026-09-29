import { ContentManager, type ContentFilters, type ContentItem } from '@/components/content-manager';
import type { Paginated } from '@/components/workspace-ui';

export default function GardenCalendar({ events, filters }: { events: Paginated<ContentItem>; filters: ContentFilters }) {
    return <ContentManager kind="event" items={events} filters={filters} />;
}
