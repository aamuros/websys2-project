import {
    CalendarDays,
    CalendarMinus2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    List,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

type CalendarView = 'calendar' | 'list';

interface GardenEvent {
    id: number;
    date: string;
    start: string;
    end: string;
    startMinutes: number;
    endMinutes: number;
    name: string;
    location: string;
    audience: string;
    type: string;
}

export interface CalendarEventRecord {
    id: number;
    title: string;
    description: string | null;
    location: string | null;
    starts_at: string;
    ends_at: string;
}

const TIME_GRID_HEIGHT = 1430;

function currentWeekStart() {
    const today = new Date();
    return addDays(today, -today.getDay());
}

const toolbarButtonClass = 'relative inline-flex h-7 items-center justify-center gap-1.5 rounded-[10px] border border-border/90 bg-card px-2.5 text-sm font-medium text-foreground shadow-[0_1px_2px_rgba(64,79,29,0.04)] transition-colors after:pointer-events-none after:absolute after:inset-0 after:rounded-[9px] after:shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] hover:bg-primary/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50';

function dateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function ordinal(day: number) {
    if (day > 10 && day < 20) return `${day}th`;
    const suffix = day % 10 === 1 ? 'st' : day % 10 === 2 ? 'nd' : day % 10 === 3 ? 'rd' : 'th';
    return `${day}${suffix}`;
}

function formatWeekRange(start: Date) {
    const end = addDays(start, 6);
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });

    if (start.getFullYear() !== end.getFullYear()) {
        return `${startMonth} ${start.getDate()}, ${start.getFullYear()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
    }

    if (start.getMonth() !== end.getMonth()) {
        return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
    }

    return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${end.getFullYear()}`;
}

function CalendarToolbar({
    weekStart,
    view,
    onWeekChange,
    onViewChange,
}: {
    weekStart: Date;
    view: CalendarView;
    onWeekChange: (start: Date) => void;
    onViewChange: (view: CalendarView) => void;
}) {
    return (
        <div className="flex min-h-7 shrink-0 items-center justify-between gap-3" aria-label="Calendar controls">
            <button type="button" className={cn(toolbarButtonClass, 'min-w-0 px-2.5 sm:px-3')} aria-label={`Selected week: ${formatWeekRange(weekStart)}`}>
                <span className="truncate">{formatWeekRange(weekStart)}</span>
                <ChevronDown className="size-4 shrink-0 stroke-[1.8]" aria-hidden="true" />
            </button>

            <div className="flex shrink-0 items-center gap-2">
                <button type="button" className={cn(toolbarButtonClass, 'hidden px-2.5 sm:inline-flex')} onClick={() => onWeekChange(currentWeekStart())}>
                    Today
                </button>

                <div className="flex h-7" aria-label="Week navigation">
                    <button
                        type="button"
                        className="relative grid size-7 place-items-center rounded-l-[10px] border border-r-0 border-border/90 bg-card transition-colors hover:bg-primary/[0.08] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                        onClick={() => onWeekChange(addDays(weekStart, -7))}
                        aria-label="Previous week"
                    >
                        <ChevronLeft className="size-4 stroke-[1.8]" aria-hidden="true" />
                    </button>
                    <span className="h-7 w-px bg-border/90" aria-hidden="true" />
                    <button
                        type="button"
                        className="relative grid size-7 place-items-center rounded-r-[10px] border border-l-0 border-border/90 bg-card transition-colors hover:bg-primary/[0.08] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                        onClick={() => onWeekChange(addDays(weekStart, 7))}
                        aria-label="Next week"
                    >
                        <ChevronRight className="size-4 stroke-[1.8]" aria-hidden="true" />
                    </button>
                </div>

                <div className="flex h-[30px] gap-0.5 rounded-[10px] bg-primary/[0.055] p-0.5" aria-label="View switcher">
                    <ViewButton label="List view" active={view === 'list'} onClick={() => onViewChange('list')}>
                        <List className="size-4 stroke-[1.8]" aria-hidden="true" />
                    </ViewButton>
                    <ViewButton label="Calendar view" active={view === 'calendar'} onClick={() => onViewChange('calendar')}>
                        <CalendarDays className="size-4 stroke-[1.8]" aria-hidden="true" />
                    </ViewButton>
                </div>
            </div>
        </div>
    );
}

function ViewButton({ label, active, onClick, children }: { label: string; active: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            className={cn(
                'grid size-[26px] place-items-center rounded-lg transition-colors hover:bg-primary/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                active && 'bg-primary/[0.12] shadow-[0_1px_3px_rgba(64,79,29,0.05),0_1px_2px_rgba(64,79,29,0.05)]',
            )}
            onClick={onClick}
            aria-label={label}
            aria-pressed={active}
            title={label}
        >
            {children}
        </button>
    );
}

function WeekHeader({ days }: { days: Date[] }) {
    return (
        <div className="grid h-10 grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b border-border bg-card">
            <div className="flex items-center justify-center text-xs font-medium text-muted-foreground">GMT +8</div>
            {days.map((day) => {
                const today = dateKey(day) === dateKey(new Date());
                return (
                    <div key={dateKey(day)} className={cn('flex items-center justify-center text-xs font-medium text-muted-foreground', today && 'text-foreground')}>
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="uppercase">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            <span className={cn(today && 'inline-flex h-[22px] min-w-[31px] items-center justify-center rounded-lg bg-primary px-1.5 text-primary-foreground')}>
                                {ordinal(day.getDate())}
                            </span>
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

function TimeGrid({ days, events }: { days: Date[]; events: GardenEvent[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const hours = Array.from({ length: 25 }, (_, hour) => hour);
    const now = new Date();
    const todayIsVisible = days.some((day) => dateKey(day) === dateKey(now));

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 440 });
    }, []);

    return (
        <div ref={scrollRef} className="app-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#fbf8f2]" aria-label="Scrollable calendar hours">
            <div className="relative" style={{ height: TIME_GRID_HEIGHT }}>
                <div className="absolute inset-y-0 left-0 z-[3] w-16 bg-card" />
                <div className="absolute inset-y-0 left-16 right-0 bg-[#fbf8f2]">
                    <div className="absolute inset-0 grid grid-cols-7" aria-hidden="true">
                        {Array.from({ length: 7 }, (_, index) => (
                            <span key={index} className="h-full border-r border-border/60 last:border-r-0" />
                        ))}
                    </div>
                    <span className="absolute left-0 right-0 top-7 border-t border-border/60" aria-hidden="true" />
                    {Array.from({ length: 24 }, (_, index) => (
                        <span key={index} className="absolute left-0 right-0 border-t border-border/60" style={{ top: 86 + index * 58 }} aria-hidden="true" />
                    ))}
                </div>

                {hours.map((hour) => {
                    const displayHour = hour === 0 || hour === 24 ? 12 : hour > 12 ? hour - 12 : hour;
                    const suffix = hour < 12 || hour === 24 ? 'am' : 'pm';
                    return (
                        <span
                            key={hour}
                            className="absolute left-0 z-[4] w-14 pr-2 text-right text-xs leading-5 text-muted-foreground"
                            style={{ top: 18 + hour * 58 }}
                        >
                            {displayHour}:00{suffix}
                        </span>
                    );
                })}

                {events.map((event) => {
                    const dayIndex = days.findIndex((day) => dateKey(day) === event.date);
                    if (dayIndex < 0) return null;
                    return (
                        <div
                            key={event.id}
                            className="absolute z-[6] overflow-hidden rounded-lg border border-primary/20 bg-primary/10 px-1.5 py-1 text-[10px] text-primary shadow-sm"
                            style={{
                                left: `calc(64px + (100% - 64px) * ${dayIndex} / 7 + 2px)`,
                                width: 'calc((100% - 64px) / 7 - 4px)',
                                top: 28 + event.startMinutes / 60 * 58,
                                height: Math.max(38, (event.endMinutes - event.startMinutes) / 60 * 58),
                            }}
                            title={`${event.name} · ${event.start}–${event.end}`}
                        >
                            <strong className="block truncate">{event.name}</strong>
                            <span className="block truncate">{event.start}</span>
                        </div>
                    );
                })}
                {todayIsVisible && <div className="pointer-events-none absolute left-0 right-0 z-[8] h-px" style={{ top: 28 + (now.getHours() * 60 + now.getMinutes()) / 60 * 58 }} aria-label="Current time">
                    <span className="absolute left-0 top-0 flex h-4 w-16 -translate-y-1/2 items-center justify-end bg-card pr-[9px] text-xs text-primary">{now.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}</span>
                    <span className="absolute left-[63.5px] top-0 h-3 w-px -translate-y-1/2 bg-primary" aria-hidden="true" />
                    <span className="absolute left-16 right-0 top-0 h-px bg-primary" aria-hidden="true" />
                </div>}
            </div>
        </div>
    );
}

function CalendarGrid({ days, events }: { days: Date[]; events: GardenEvent[] }) {
    return (
        <div className="min-h-0 flex-1 overflow-x-auto">
            <div className="flex h-full min-w-[760px] flex-col">
                <WeekHeader days={days} />
                <TimeGrid days={days} events={events} />
            </div>
        </div>
    );
}

function ListView({ days, events }: { days: Date[]; events: GardenEvent[] }) {
    return (
        <>
            <div className="grid h-[42px] shrink-0 grid-cols-[148px_132px_minmax(0,1fr)_132px] items-center border-b border-border/80 bg-card/95 text-[10px] font-semibold uppercase leading-[14px] tracking-[0.075em] text-[#858a72] backdrop-blur-sm max-[900px]:grid-cols-[126px_112px_minmax(0,1fr)] max-[620px]:hidden" aria-hidden="true">
                <div className="flex h-[41px] items-center pl-5 pr-[18px]">Day</div>
                <div className="flex h-[41px] items-center px-[18px]">Time</div>
                <div className="flex h-[41px] items-center px-[18px]">Activity</div>
                <div className="flex h-[41px] items-center justify-end pl-[18px] pr-[22px] max-[900px]:hidden">Type</div>
            </div>

            <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#fbf8f2]">
                {days.map((day) => {
                    const key = dateKey(day);
                    const dayEvents = events.filter((event) => event.date === key);
                    const today = key === dateKey(new Date());
                    const eventLabel = dayEvents.length === 1 ? '1 event' : `${dayEvents.length} events`;

                    return (
                        <section
                            key={key}
                            className={cn(
                                'relative grid min-h-[72px] grid-cols-[148px_minmax(0,1fr)] border-b border-border/50 bg-[#fbf8f2] last:border-b-0 max-[900px]:grid-cols-[126px_minmax(0,1fr)] max-[620px]:grid-cols-[88px_minmax(0,1fr)]',
                                today && 'bg-primary/[0.018] before:absolute before:inset-y-0 before:left-0 before:z-[2] before:w-[3px] before:bg-primary',
                            )}
                        >
                            <div className="flex min-h-full items-center border-r border-border/50 bg-[rgba(248,243,237,0.54)] py-3.5 pl-5 pr-3.5 max-[900px]:pl-3.5 max-[620px]:px-2.5 max-[620px]:py-[13px] max-[620px]:pl-3">
                                <div className="grid w-full min-w-0 grid-cols-[34px_minmax(0,1fr)] grid-rows-[auto_auto] items-center gap-x-[9px] max-[900px]:grid-cols-[32px_minmax(0,1fr)] max-[900px]:gap-x-[7px] max-[620px]:flex max-[620px]:flex-col max-[620px]:items-start max-[620px]:gap-[3px]">
                                    <span className={cn(
                                        'row-span-2 inline-flex size-[34px] items-center justify-center rounded-[10px] bg-primary/[0.055] text-sm font-semibold leading-5 tracking-[-0.01em] text-primary max-[900px]:size-8 max-[620px]:order-1',
                                        today && 'bg-primary text-primary-foreground shadow-[0_1px_2px_rgba(64,79,29,0.14)]',
                                    )}>
                                        {day.getDate()}
                                    </span>
                                    <span className="col-start-2 min-w-0 whitespace-nowrap text-xs font-semibold leading-4 text-primary max-[620px]:order-2 max-[620px]:text-[11px]">
                                        {day.toLocaleDateString('en-US', { weekday: 'long' })}
                                    </span>
                                    <span className={cn('col-start-2 whitespace-nowrap text-[10px] font-medium leading-[13px] text-[#8a8f79] max-[620px]:hidden', today && 'font-semibold text-primary')}>
                                        {today ? 'Today' : dayEvents.length === 0 ? 'No events' : eventLabel}
                                    </span>
                                </div>
                            </div>

                            <div className="min-w-0 bg-transparent">
                                {dayEvents.length === 0 ? (
                                    <div className="grid min-h-[76px] grid-cols-[132px_minmax(0,1fr)_132px] items-center text-xs leading-4 max-[900px]:grid-cols-[112px_minmax(0,1fr)] max-[620px]:min-h-[68px] max-[620px]:grid-cols-1">
                                        <span className="col-start-2 ml-[18px] inline-flex items-center gap-2 justify-self-start font-medium tracking-[0.002em] text-[#929684] max-[620px]:col-start-1 max-[620px]:ml-3.5">
                                            <CalendarMinus2 className="size-4 shrink-0 stroke-[1.6] text-[#a4a895]" aria-hidden="true" />
                                            Nothing scheduled
                                        </span>
                                    </div>
                                ) : dayEvents.map((event) => (
                                    <article key={event.id} className="relative grid min-h-[76px] grid-cols-[132px_minmax(0,1fr)_132px] items-center border-b border-border/40 transition-colors last:border-b-0 hover:bg-primary/[0.032] max-[900px]:grid-cols-[112px_minmax(0,1fr)] max-[620px]:grid-cols-1 max-[620px]:gap-0 max-[620px]:px-3.5 max-[620px]:py-[10px] max-[620px]:pb-[11px]">
                                        <p className="flex self-stretch items-center whitespace-nowrap px-[18px] text-xs font-medium leading-[17px] tabular-nums text-[#747a62] max-[620px]:h-auto max-[620px]:self-auto max-[620px]:p-0 max-[620px]:text-[11px] max-[620px]:leading-[15px]">
                                            <strong className="font-semibold text-primary">{event.start}</strong>&nbsp;– {event.end}
                                        </p>
                                        <div className="flex min-w-0 self-stretch flex-col justify-center px-[18px] py-[11px] max-[620px]:p-0 max-[620px]:pt-0.5">
                                            <h3 className="truncate text-sm font-semibold leading-5 tracking-[-0.005em] text-primary">{event.name}</h3>
                                            <p className="mt-[3px] truncate text-xs leading-4 text-[#777d65]">
                                                {event.location}<span className="px-1 text-[#a4a895]">·</span>{event.audience}
                                            </p>
                                        </div>
                                        <span className="mr-[22px] inline-flex min-h-[25px] items-center justify-center justify-self-end whitespace-nowrap rounded-full border border-primary/10 bg-primary/[0.055] px-[9px] py-1 text-[10.5px] font-semibold leading-[15px] text-primary max-[900px]:hidden">{event.type}</span>
                                    </article>
                                ))}
                            </div>
                        </section>
                    );
                })}
            </div>
        </>
    );
}

export function GardenCalendarWorkspace({ title, description, events }: { title: string; description: string; events: CalendarEventRecord[] }) {
    const [weekStart, setWeekStart] = useState(currentWeekStart);
    const [view, setView] = useState<CalendarView>('calendar');
    const gardenEvents = useMemo<GardenEvent[]>(() => events.map((event) => {
        const start = new Date(event.starts_at);
        const end = new Date(event.ends_at);
        const formatTime = (date: Date) => date.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
        return {
            id: event.id,
            date: dateKey(start),
            start: formatTime(start),
            end: formatTime(end),
            startMinutes: start.getHours() * 60 + start.getMinutes(),
            endMinutes: dateKey(end) === dateKey(start) ? end.getHours() * 60 + end.getMinutes() : 24 * 60,
            name: event.title,
            location: event.location ?? 'Location to be announced',
            audience: 'Garden community',
            type: 'Garden event',
        };
    }), [events]);
    const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
    const weekEvents = useMemo(() => {
        const startKey = dateKey(days[0]);
        const endKey = dateKey(days[6]);
        return gardenEvents.filter((event) => event.date >= startKey && event.date <= endKey);
    }, [days, gardenEvents]);

    return (
        <AppLayout title={title} description={description}>
            <section className="flex h-[calc(100dvh-181px)] min-h-[360px] flex-col" aria-label="Garden calendar">
                <CalendarToolbar weekStart={weekStart} view={view} onWeekChange={setWeekStart} onViewChange={setView} />
                <div className={cn('mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-[#fbf8f2]', view === 'list' ? 'border-border/90 shadow-[0_1px_2px_rgba(64,79,29,0.025)]' : 'border-border')}>
                    {view === 'calendar' ? <CalendarGrid days={days} events={weekEvents} /> : <ListView days={days} events={weekEvents} />}
                </div>
            </section>
        </AppLayout>
    );
}
