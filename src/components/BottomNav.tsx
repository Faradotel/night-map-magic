import { Map, Search, Heart, User } from 'lucide-react';

type Tab = 'map' | 'search' | 'profile';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs: { id: Tab; icon: typeof Map; label: string }[] = [
    { id: 'map', icon: Map, label: 'Explorer' },
    { id: 'search', icon: Search, label: 'Recherche' },
    { id: 'profile', icon: User, label: 'Profil' },
  ];

  return (
    <nav
      className="absolute bottom-0 left-0 right-0 h-16 flex items-center z-[400]"
      style={{
        background: 'rgba(26, 13, 21, 0.9)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid hsl(0 0% 100% / 0.05)',
      }}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 h-full flex flex-col items-center justify-center gap-1 transition-all"
          >
            <tab.icon
              size={22}
              strokeWidth={isActive ? 2.5 : 1.5}
              style={{
                color: isActive ? 'hsl(325 89% 50%)' : 'hsl(225 15% 40%)',
                filter: isActive ? 'drop-shadow(0 0 8px hsl(325 89% 50% / 0.6))' : 'none',
                transition: 'all 0.2s ease',
              }}
            />
            <span
              className="text-[10px] font-bold uppercase tracking-widest transition-all"
              style={{
                color: isActive ? 'hsl(325 89% 50%)' : 'hsl(225 15% 40%)',
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
