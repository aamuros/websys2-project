import { CheckCircle2, Clock3, XCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export const requestStatusDetails: Record<RequestStatus, {
    label: string;
    summary: string;
    tone: string;
    icon: LucideIcon;
}> = {
    pending: {
        label: 'Pending',
        summary: 'Garden staff are reviewing your request. We’ll update this page when a decision is made.',
        tone: 'bg-amber-100 text-amber-900',
        icon: Clock3,
    },
    approved: {
        label: 'Approved',
        summary: 'Your request has been approved. Check My assignments for the next steps and access details.',
        tone: 'bg-primary/[0.09] text-primary',
        icon: CheckCircle2,
    },
    rejected: {
        label: 'Rejected',
        summary: 'This request was not approved. You can browse the directory and request another available plot.',
        tone: 'bg-destructive/10 text-destructive',
        icon: XCircle,
    },
    cancelled: {
        label: 'Cancelled',
        summary: 'This request is closed. You can submit a new request for any available plot.',
        tone: 'bg-secondary text-muted-foreground',
        icon: XCircle,
    },
};

export function RequestBadge({ status }: { status: RequestStatus }) {
    const details = requestStatusDetails[status];
    const Icon = details.icon;

    return (
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', details.tone)}>
            <Icon className="size-3.5" aria-hidden="true" />
            {details.label}
        </span>
    );
}
