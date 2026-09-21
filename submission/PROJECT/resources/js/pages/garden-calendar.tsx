import { ContentManager } from '@/components/content-manager'; import type { Paginated } from '@/components/workspace-ui';
export default function GardenCalendar({events,filters}:{events:Paginated<any>;filters:any}){return <ContentManager kind="event" items={events} filters={filters}/>}
