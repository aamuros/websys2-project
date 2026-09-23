import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateValue(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function PlantingCalendar({ value, min, max, onChange }: { value: string; min: string; max: string; onChange: (value: string) => void }) {
    const [year, month] = value.split('-').map(Number);
    const [visibleMonth, setVisibleMonth] = useState(new Date(year, month - 1, 1));
    const currentYear = visibleMonth.getFullYear();
    const currentMonth = visibleMonth.getMonth();
    const firstWeekday = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const previousMonth = new Date(currentYear, currentMonth - 1, 1);
    const nextMonth = new Date(currentYear, currentMonth + 1, 1);
    const monthLabel = visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return <div className="mx-auto w-full max-w-[300px] rounded-xl border bg-card p-2">
        <div className="mb-2 flex items-center justify-between">
            <button type="button" aria-label="Previous month" disabled={dateValue(previousMonth.getFullYear(), previousMonth.getMonth(), 1).slice(0, 7) < min.slice(0, 7)} onClick={() => setVisibleMonth(previousMonth)} className="grid size-8 place-items-center rounded-md hover:bg-emerald-50 disabled:opacity-30"><ChevronLeft className="size-4" /></button>
            <strong className="text-sm">{monthLabel}</strong>
            <button type="button" aria-label="Next month" disabled={dateValue(nextMonth.getFullYear(), nextMonth.getMonth(), 1).slice(0, 7) > max.slice(0, 7)} onClick={() => setVisibleMonth(nextMonth)} className="grid size-8 place-items-center rounded-md hover:bg-emerald-50 disabled:opacity-30"><ChevronRight className="size-4" /></button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] text-muted-foreground">{weekdays.map(day => <span key={day} className="py-1">{day}</span>)}</div>
        <div className="grid grid-cols-7 gap-0.5">{Array.from({ length: firstWeekday }, (_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const date = dateValue(currentYear, currentMonth, day);
            const selected = date === value;
            return <button key={date} type="button" aria-label={new Date(currentYear, currentMonth, day).toLocaleDateString('en-US', { dateStyle: 'full' })} aria-pressed={selected} disabled={date < min || date > max} onClick={() => onChange(date)} className={`h-9 rounded-md text-xs font-medium transition-colors disabled:text-muted-foreground/35 ${selected ? 'bg-emerald-700 text-white' : 'hover:bg-emerald-100'}`}>{day}</button>;
        })}</div>
    </div>;
}
