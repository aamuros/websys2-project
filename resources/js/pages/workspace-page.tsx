import { Head } from '@inertiajs/react';
import { GardenCalendarWorkspace, type CalendarEventRecord } from '@/components/garden-calendar-workspace';
import { GardenPlotsWorkspace } from '@/components/garden-plots-workspace';
import { PlotRequestsWorkspace, type PlotRequest } from '@/components/plot-requests-workspace';
import { AppLayout } from '@/layouts/app-layout';

export default function WorkspacePage({
    title,
    description,
    page,
    plotRequests = [],
    calendarEvents = [],
    manageEventsHref = null,
}: {
    title: string;
    description: string;
    page: string;
    plotRequests?: PlotRequest[];
    calendarEvents?: CalendarEventRecord[];
    manageEventsHref?: string | null;
}) {
    if (page === 'garden-plots') {
        return (
            <>
                <Head title={title} />
                <GardenPlotsWorkspace title={title} description={description} />
            </>
        );
    }

    if (page === 'plot-requests') {
        return (
            <>
                <Head title={title} />
                <PlotRequestsWorkspace title={title} description={description} requests={plotRequests} />
            </>
        );
    }

    if (page === 'garden-calendar') {
        return (
            <>
                <Head title={title} />
                <GardenCalendarWorkspace title={title} description={description} events={calendarEvents} manageEventsHref={manageEventsHref} />
            </>
        );
    }

    return (
        <>
            <Head title={title} />
            <AppLayout title={title} description={description} />
        </>
    );
}
