import { Sprout } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
    return (
        <div className={cn('flex items-center gap-3', className)}>
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm"><Sprout className="size-5" /></span>
            {!compact && <span className="leading-tight"><strong className="block text-sm font-semibold tracking-tight">Community Garden</strong><span className="block text-[11px] text-muted-foreground">Management System</span></span>}
        </div>
    );
}
