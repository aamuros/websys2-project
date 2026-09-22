import { Head } from '@inertiajs/react';
import { GardenCalendarWorkspace } from '@/components/garden-calendar-workspace';
import { GardenPlotsWorkspace } from '@/components/garden-plots-workspace';
import { PlotRequestsWorkspace, type PlotRequest } from '@/components/plot-requests-workspace';
import { AppLayout } from '@/layouts/app-layout';

export default function WorkspacePage({
    title,
    description,
    page,
    plotRequests = [],
}: {
    title: string;
    description: string;
    page: string;
    plotRequests?: PlotRequest[];
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
                <GardenCalendarWorkspace title={title} description={description} />
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
