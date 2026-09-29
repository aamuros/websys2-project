import { Search, X } from 'lucide-react';
import { useId, useRef } from 'react';
import { cn } from '@/lib/utils';

export function WorkspaceSearch({ value, onChange, label, placeholder, onSubmit, onClear, className }: {
    value: string;
    onChange: (value: string) => void;
    label: string;
    placeholder: string;
    onSubmit?: () => void;
    onClear?: () => void;
    className?: string;
}) {
    const id = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const field = (
        <div className="flex h-10 items-center gap-1 rounded-full border border-input bg-card px-1 text-foreground shadow-[0_1px_2px_rgba(64,79,29,0.06)] transition-[border-color,box-shadow] focus-within:border-ring/60 focus-within:ring-2 focus-within:ring-ring/15">
            {onSubmit ? (
                <button type="submit" aria-label={label} title="Search" className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-primary/[0.08] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                    <Search className="size-4" strokeWidth={1.8} aria-hidden="true" />
                </button>
            ) : (
                <span className="pointer-events-none grid size-8 shrink-0 place-items-center text-muted-foreground"><Search className="size-4" strokeWidth={1.8} aria-hidden="true" /></span>
            )}
            <label htmlFor={id} className="sr-only">{label}</label>
            <input
                id={id}
                ref={inputRef}
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="h-full min-w-0 flex-1 appearance-none bg-transparent pr-2 text-sm leading-5 outline-none placeholder:text-muted-foreground/70 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
            />
            {value.length > 0 && (
                <button type="button" aria-label="Clear search" title="Clear search" onClick={() => { onChange(''); onClear?.(); inputRef.current?.focus(); }} className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-primary/[0.08] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                    <X className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
                </button>
            )}
        </div>
    );

    return onSubmit ? (
        <form role="search" className={cn('w-full', className)} onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>{field}</form>
    ) : (
        <div role="search" className={cn('w-full', className)}>{field}</div>
    );
}
