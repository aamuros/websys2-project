import { ContentManager } from '@/components/content-manager'; import type { Paginated } from '@/components/workspace-ui';
export default function CommunityUpdates({updates,filters}:{updates:Paginated<any>;filters:any}){return <ContentManager kind="update" items={updates} filters={filters}/>}
