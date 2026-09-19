import { usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    CloudRain,
    CloudSun,
    Droplets,
    LoaderCircle,
    MapPin,
    RefreshCw,
    Ruler,
    Search,
    Send,
    Sprout,
    Wind,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

type PlotStatus = 'available' | 'reserved' | 'occupied' | 'maintenance';
type StatusFilter = 'all' | PlotStatus;

interface GardenPlot {
    id: number;
    plot_code: string;
    location: string;
    size: number;
    status: PlotStatus;
    has_pending_request: boolean;
}

interface PlotApiResponse {
    data: GardenPlot[];
    meta: { total: number; generated_at: string };
}

interface OpenMeteoResponse {
    current: {
        temperature_2m: number;
        relative_humidity_2m: number;
        weather_code: number;
        wind_speed_10m: number;
        time: string;
    };
    daily?: { precipitation_probability_max?: number[] };
}

interface GardenWeatherData {
    temperature: number;
    humidity: number;
    windSpeed: number;
    precipitationChance: number | null;
    weatherCode: number;
    observedAt: string;
}

interface ApiErrorPayload {
    message?: string;
    errors?: Record<string, string[]>;
}

const WEATHER_ENDPOINT = 'https://api.open-meteo.com/v1/forecast?latitude=14.5995&longitude=120.9842&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=precipitation_probability_max&timezone=Asia%2FManila&forecast_days=1';

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
    { value: 'all', label: 'All statuses' },
    { value: 'available', label: 'Available' },
    { value: 'reserved', label: 'Reserved' },
    { value: 'occupied', label: 'Occupied' },
    { value: 'maintenance', label: 'Maintenance' },
];

const statusStyles: Record<PlotStatus, string> = {
    available: 'bg-primary/[0.09] text-primary',
    reserved: 'bg-amber-100 text-amber-800',
    occupied: 'bg-stone-200 text-stone-700',
    maintenance: 'bg-red-100 text-red-800',
};

function humanizeStatus(status: PlotStatus) {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function weatherDescription(code: number) {
    if (code === 0) return 'Clear skies';
    if (code <= 2) return 'Partly cloudy';
    if (code === 3) return 'Overcast';
    if (code <= 48) return 'Foggy';
    if (code <= 57) return 'Light drizzle';
    if (code <= 67) return 'Rain';
    if (code <= 77) return 'Wintry weather';
    if (code <= 82) return 'Rain showers';
    if (code <= 86) return 'Snow showers';
    return 'Thunderstorms';
}

function formatObservedTime(value: string) {
    const time = value.split('T')[1];
    if (!time) return value;

    const [hours, minutes] = time.split(':').map(Number);
    return new Intl.DateTimeFormat('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(2000, 0, 1, hours, minutes));
}

function GardenWeather() {
    const [weather, setWeather] = useState<GardenWeatherData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        async function loadWeather() {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(WEATHER_ENDPOINT, {
                    headers: { Accept: 'application/json' },
                    signal: controller.signal,
                });

                if (!response.ok) throw new Error('Weather service returned an error.');

                const payload = await response.json() as OpenMeteoResponse;
                if (typeof payload.current?.temperature_2m !== 'number') {
                    throw new Error('Weather service returned incomplete data.');
                }

                setWeather({
                    temperature: payload.current.temperature_2m,
                    humidity: payload.current.relative_humidity_2m,
                    windSpeed: payload.current.wind_speed_10m,
                    precipitationChance: payload.daily?.precipitation_probability_max?.[0] ?? null,
                    weatherCode: payload.current.weather_code,
                    observedAt: payload.current.time,
                });
            } catch (caughtError) {
                if (caughtError instanceof DOMException && caughtError.name === 'AbortError') return;
                setError(caughtError instanceof Error ? caughtError.message : 'Live weather is unavailable.');
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }

        void loadWeather();
        return () => controller.abort();
    }, [attempt]);

    return (
        <section aria-labelledby="garden-weather-title" className="overflow-hidden rounded-[22px] bg-primary text-primary-foreground shadow-[0_12px_36px_rgba(64,79,29,0.14)]">
            <div className="grid min-h-44 md:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
                <div className="flex items-center gap-5 p-6 sm:p-8">
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white/10" aria-hidden="true">
                        {weather && weather.weatherCode >= 51 ? <CloudRain className="size-6" /> : <CloudSun className="size-6" />}
                    </span>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/60">Live API data · Manila</p>
                        <h2 id="garden-weather-title" className="mt-2 text-xl font-semibold tracking-[-0.02em] sm:text-2xl">Garden conditions</h2>
                        {loading && <p className="mt-2 text-sm text-primary-foreground/65">Checking the latest weather…</p>}
                        {!loading && weather && (
                            <p className="mt-2 text-sm text-primary-foreground/70">
                                {weatherDescription(weather.weatherCode)} · observed {formatObservedTime(weather.observedAt)}
                            </p>
                        )}
                        {!loading && error && (
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                                <p className="text-sm text-primary-foreground/70">{error}</p>
                                <button type="button" onClick={() => setAttempt((value) => value + 1)} className="inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
                                    <RefreshCw className="size-3.5" aria-hidden="true" />Retry
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-3 border-t border-white/10 bg-black/[0.06] md:border-l md:border-t-0">
                    <WeatherMetric label="Temperature" value={loading ? '—' : weather ? `${Math.round(weather.temperature)}°C` : 'N/A'} icon={Sprout} />
                    <WeatherMetric label="Rain chance" value={loading ? '—' : weather?.precipitationChance != null ? `${weather.precipitationChance}%` : 'N/A'} icon={Droplets} />
                    <WeatherMetric label="Wind" value={loading ? '—' : weather ? `${Math.round(weather.windSpeed)} km/h` : 'N/A'} icon={Wind} />
                </div>
            </div>
            <p className="border-t border-white/10 px-6 py-2.5 text-[11px] text-primary-foreground/55 sm:px-8">
                Source: Open-Meteo Forecast API. Conditions help members plan watering and garden visits.
            </p>
        </section>
    );
}

function WeatherMetric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Sprout }) {
    return (
        <div className="flex min-w-0 flex-col justify-center border-l border-white/10 px-3 py-6 first:border-l-0 sm:px-5 md:py-8">
            <Icon className="size-4 text-primary-foreground/55" aria-hidden="true" />
            <span className="mt-3 truncate text-lg font-semibold sm:text-xl">{value}</span>
            <span className="mt-1 truncate text-[10px] font-medium uppercase tracking-[0.1em] text-primary-foreground/55 sm:text-xs">{label}</span>
        </div>
    );
}

function RequestPlotDialog({
    plot,
    onClose,
    onSubmitted,
}: {
    plot: GardenPlot | null;
    onClose: () => void;
    onSubmitted: (plot: GardenPlot, message: string) => void;
}) {
    const [notes, setNotes] = useState('');
    const [notesError, setNotesError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setNotes('');
        setNotesError(null);
        setFormError(null);
    }, [plot?.id]);

    function validateNotes() {
        const trimmedNotes = notes.trim();
        if (!trimmedNotes) return 'Tell us briefly how you plan to use the plot.';
        if (trimmedNotes.length < 10) return 'Please enter at least 10 characters.';
        if (trimmedNotes.length > 500) return 'Please keep your note to 500 characters or fewer.';
        return null;
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!plot) return;

        const validationError = validateNotes();
        setNotesError(validationError);
        setFormError(null);
        if (validationError) return;

        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
        if (!csrfToken) {
            setFormError('The security token is missing. Refresh the page and try again.');
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch('/api/plot-requests', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ garden_plot_id: plot.id, notes: notes.trim() }),
            });
            const payload = await response.json() as ApiErrorPayload;

            if (!response.ok) {
                const serverNotesError = payload.errors?.notes?.[0];
                if (serverNotesError) setNotesError(serverNotesError);

                const requestError = payload.errors?.garden_plot_id?.[0];
                setFormError(requestError ?? payload.message ?? 'The request could not be submitted.');
                return;
            }

            onSubmitted(plot, payload.message ?? `Your request for plot ${plot.plot_code} was submitted.`);
        } catch {
            setFormError('The request could not reach the server. Check your connection and try again.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={plot !== null} onOpenChange={(open) => !open && !submitting && onClose()}>
            {plot && (
                <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl p-5 sm:p-6">
                    <DialogHeader>
                        <DialogTitle>Request plot {plot.plot_code}</DialogTitle>
                        <DialogDescription>
                            {plot.location} · {plot.size.toFixed(2)} m². Your request will be reviewed by garden staff.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} noValidate className="space-y-5">
                        {formError && (
                            <Alert variant="destructive">
                                <AlertTitle>Request not submitted</AlertTitle>
                                <AlertDescription>{formError}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <div className="flex items-end justify-between gap-3">
                                <Label htmlFor="request-notes">How will you use this plot?</Label>
                                <span className="text-xs tabular-nums text-muted-foreground">{notes.length}/500</span>
                            </div>
                            <textarea
                                id="request-notes"
                                required
                                minLength={10}
                                maxLength={500}
                                value={notes}
                                onChange={(event) => {
                                    setNotes(event.target.value);
                                    if (notesError) setNotesError(null);
                                }}
                                onBlur={() => setNotesError(validateNotes())}
                                aria-invalid={Boolean(notesError)}
                                aria-describedby={notesError ? 'request-notes-error' : 'request-notes-help'}
                                placeholder="For example: I plan to grow vegetables for our household and share extra produce."
                                className="min-h-32 w-full resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-sm leading-5 text-foreground shadow-sm outline-none placeholder:text-muted-foreground/65 focus:border-ring focus:ring-2 focus:ring-ring/20 aria-invalid:border-destructive aria-invalid:ring-destructive/15"
                            />
                            {notesError ? (
                                <p id="request-notes-error" role="alert" className="text-sm text-destructive">{notesError}</p>
                            ) : (
                                <p id="request-notes-help" className="text-xs leading-5 text-muted-foreground">Enter 10–500 characters. Include the crops or community purpose you have in mind.</p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
                                {submitting ? 'Submitting…' : 'Submit request'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            )}
        </Dialog>
    );
}

export function GardenPlotsWorkspace({ title, description }: { title: string; description: string }) {
    const { auth } = usePage<SharedPageProps>().props;
    const isMember = auth.user?.role === 'member';
    const [plots, setPlots] = useState<GardenPlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [loadAttempt, setLoadAttempt] = useState(0);
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<StatusFilter>('all');
    const [selectedPlot, setSelectedPlot] = useState<GardenPlot | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        async function loadPlots() {
            setLoading(true);
            setLoadError(null);

            try {
                const response = await fetch('/api/garden-plots', {
                    headers: { Accept: 'application/json' },
                    signal: controller.signal,
                });

                if (!response.ok) throw new Error('The plot directory could not be loaded.');

                const payload = await response.json() as PlotApiResponse;
                if (!Array.isArray(payload.data)) throw new Error('The plot directory returned invalid data.');
                setPlots(payload.data);
            } catch (caughtError) {
                if (caughtError instanceof DOMException && caughtError.name === 'AbortError') return;
                setLoadError(caughtError instanceof Error ? caughtError.message : 'The plot directory is unavailable.');
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }

        void loadPlots();
        return () => controller.abort();
    }, [loadAttempt]);

    const filteredPlots = useMemo(() => {
        const normalizedQuery = query.trim().toLocaleLowerCase();

        return plots.filter((plot) => {
            const matchesStatus = status === 'all' || plot.status === status;
            const matchesQuery = !normalizedQuery
                || plot.plot_code.toLocaleLowerCase().includes(normalizedQuery)
                || plot.location.toLocaleLowerCase().includes(normalizedQuery);

            return matchesStatus && matchesQuery;
        });
    }, [plots, query, status]);

    const availableCount = plots.filter((plot) => plot.status === 'available').length;
    const hasFilters = query.trim() !== '' || status !== 'all';

    function markRequestSubmitted(plot: GardenPlot, message: string) {
        setPlots((current) => current.map((item) => item.id === plot.id ? { ...item, has_pending_request: true } : item));
        setSelectedPlot(null);
        setSuccessMessage(message);
    }

    return (
        <AppLayout title={title} description={description}>
            <div className="space-y-8 pb-12 sm:space-y-10">
                <GardenWeather />

                {successMessage && (
                    <Alert className="border-primary/20 bg-primary/[0.055]" aria-live="polite">
                        <CheckCircle2 className="text-primary" aria-hidden="true" />
                        <AlertTitle>Request received</AlertTitle>
                        <AlertDescription>{successMessage} Garden staff can now review it.</AlertDescription>
                    </Alert>
                )}

                <section aria-labelledby="plot-directory-title">
                    <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Plot directory</p>
                            <h2 id="plot-directory-title" className="mt-1 text-xl font-semibold tracking-[-0.025em] text-foreground">Find your growing space</h2>
                            <p className="mt-1 text-sm text-muted-foreground">{availableCount} of {plots.length} plots currently available.</p>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-[minmax(210px,1fr)_150px]" role="search">
                            <label className="relative block">
                                <span className="sr-only">Search plots by code or location</span>
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                                <input
                                    type="search"
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Search code or location"
                                    className="h-10 w-full rounded-xl border border-input bg-card pl-9 pr-9 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/20"
                                />
                                {query && (
                                    <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-primary/[0.07] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
                                        <X className="size-3.5" aria-hidden="true" />
                                    </button>
                                )}
                            </label>
                            <label>
                                <span className="sr-only">Filter plots by status</span>
                                <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20">
                                    {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                            </label>
                        </div>
                    </div>

                    <div className="flex min-h-10 items-center justify-between gap-4 py-3 text-sm text-muted-foreground" aria-live="polite">
                        <p>{loading ? 'Loading plots…' : `${filteredPlots.length} ${filteredPlots.length === 1 ? 'plot' : 'plots'} shown`}</p>
                        {hasFilters && <button type="button" onClick={() => { setQuery(''); setStatus('all'); }} className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">Clear filters</button>}
                    </div>

                    {loadError && (
                        <Alert variant="destructive" className="mt-2">
                            <AlertTitle>Could not load plots</AlertTitle>
                            <AlertDescription className="flex flex-wrap items-center gap-3">
                                <span>{loadError}</span>
                                <button type="button" onClick={() => setLoadAttempt((value) => value + 1)} className="inline-flex items-center gap-1.5 font-semibold underline underline-offset-4">
                                    <RefreshCw className="size-3.5" aria-hidden="true" />Try again
                                </button>
                            </AlertDescription>
                        </Alert>
                    )}

                    {loading && (
                        <div className="grid min-h-52 place-items-center border-y border-border text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-2"><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />Retrieving plots with fetch…</span>
                        </div>
                    )}

                    {!loading && !loadError && filteredPlots.length === 0 && (
                        <div className="grid min-h-52 place-items-center border-y border-border px-4 text-center">
                            <div>
                                <Search className="mx-auto size-5 text-muted-foreground" aria-hidden="true" />
                                <p className="mt-3 font-semibold text-foreground">No matching plots</p>
                                <p className="mt-1 text-sm text-muted-foreground">Try a different plot code, location, or status.</p>
                            </div>
                        </div>
                    )}

                    {!loading && !loadError && filteredPlots.length > 0 && (
                        <div className="border-y border-border">
                            <div className="hidden grid-cols-[minmax(145px,1.2fr)_minmax(130px,1fr)_90px_120px_150px] gap-4 border-b border-border px-2 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground md:grid" aria-hidden="true">
                                <span>Plot</span><span>Location</span><span>Size</span><span>Status</span><span className="text-right">Action</span>
                            </div>
                            <ul className="divide-y divide-border">
                                {filteredPlots.map((plot) => {
                                    const requestSubmitted = plot.has_pending_request;
                                    return (
                                        <li key={plot.id} className="grid gap-4 px-2 py-5 transition-colors hover:bg-primary/[0.025] md:grid-cols-[minmax(145px,1.2fr)_minmax(130px,1fr)_90px_120px_150px] md:items-center">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-foreground">Plot {plot.plot_code}</p>
                                                <p className="mt-1 text-xs text-muted-foreground md:hidden">Community growing bed</p>
                                            </div>
                                            <p className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground"><MapPin className="size-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{plot.location}</span></p>
                                            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Ruler className="size-3.5 shrink-0" aria-hidden="true" />{plot.size.toFixed(2)} m²</p>
                                            <div><span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', statusStyles[plot.status])}>{humanizeStatus(plot.status)}</span></div>
                                            <div className="md:text-right">
                                                {isMember && plot.status === 'available' ? (
                                                    <Button type="button" size="sm" variant={requestSubmitted ? 'secondary' : 'default'} disabled={requestSubmitted} onClick={() => setSelectedPlot(plot)} className="w-full md:w-auto">
                                                        {requestSubmitted ? <CheckCircle2 aria-hidden="true" /> : <Sprout aria-hidden="true" />}
                                                        {requestSubmitted ? 'Requested' : 'Request plot'}
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs font-medium text-muted-foreground">{isMember ? 'Not open' : 'Member requests only'}</span>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </section>
            </div>

            <RequestPlotDialog plot={selectedPlot} onClose={() => setSelectedPlot(null)} onSubmitted={markRequestSubmitted} />
        </AppLayout>
    );
}
