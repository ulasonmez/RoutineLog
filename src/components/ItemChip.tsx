'use client';

interface ItemChipProps {
    name: string;
    selected?: boolean;
    onClick?: () => void;
    disabled?: boolean;
}

export function ItemChip({ name, selected = false, onClick, disabled = false }: ItemChipProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        px-4 py-2.5 rounded-xl text-sm font-medium
        transition-all duration-200 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        ${selected
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/10'
                }
      `}
        >
            {name}
        </button>
    );
}

interface ItemChipListProps {
    items: { id: string; name: string }[];
    selectedIds: string[];
    onToggle: (id: string) => void;
}

export function ItemChipList({ items, selectedIds, onToggle }: ItemChipListProps) {
    if (items.length === 0) {
        return (
            <p className="text-gray-500 text-sm text-center py-4">
                Henüz öğe eklenmedi
            </p>
        );
    }

    return (
        <div className="flex flex-wrap gap-2">
            {items.map((item) => (
                <ItemChip
                    key={item.id}
                    name={item.name}
                    selected={selectedIds.includes(item.id)}
                    onClick={() => onToggle(item.id)}
                />
            ))}
        </div>
    );
}
