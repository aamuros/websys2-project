import { Flower2, Leaf, Sprout, type LucideIcon } from 'lucide-react';

export const cropTypes = ['fruit', 'vegetable', 'herb', 'flower'] as const;
export type CropType = typeof cropTypes[number];

const icons: Record<Exclude<CropType, 'fruit'>, LucideIcon> = {
    vegetable: Sprout,
    herb: Leaf,
    flower: Flower2,
};

export function CropTypeIcon({ type }: { type: CropType }) {
    if (type === 'fruit') {
        return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-7 text-emerald-700" aria-hidden="true">
            <path d="M16 27v-9m0 5-5-4m5 2 5-4M12 27h8" />
            <path d="M7 20c-3-1-4-5-2-7-1-4 2-7 6-7 2-3 7-3 9 0 4-1 7 2 7 6 3 3 1 7-2 8" />
            <circle cx="11" cy="14" r="1.5" /><circle cx="20" cy="12" r="1.5" /><circle cx="23" cy="18" r="1.5" />
        </svg>;
    }

    const Icon = icons[type];

    return <Icon className="size-7 text-emerald-700" strokeWidth={1.6} aria-hidden="true" />;
}
