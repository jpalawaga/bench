interface TabBarProps {
  tabs: string[];
  activeIndex: number;
  onTabChange: (index: number) => void;
}

export function TabBar({ tabs, activeIndex, onTabChange }: TabBarProps) {
  if (tabs.length <= 1) return null;

  return (
    <div className="flex border-b border-border">
      {tabs.map((tab, i) => (
        <button
          key={tab}
          onClick={() => onTabChange(i)}
          className={`
            flex-1 py-3 text-sm font-medium text-center transition-colors min-h-0
            ${
              i === activeIndex
                ? "text-accent border-b-2 border-accent"
                : "text-text-muted active:text-text-secondary"
            }
          `}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
