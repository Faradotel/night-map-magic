import { Map, Search, User, Users } from 'lucide-react';

type Tab = 'map' | 'search' | 'friends' | 'profile';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs: { id: Tab; icon: typeof Map; label: string }[] = [
    { id: 'map', icon: Map, label: 'Explorer' },
    { id: 'search', icon: Search, label: 'Recherche' },
    { id: 'friends', icon: Users, label: 'Amis' },
    { id: 'profile', icon: User, label: 'Profil' },
  ];

  return (
    <nav
      className="absolute bottom-0 left-0 right-0 h-16 flex items-center z-[400]"
      style={{
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--nav-border)',
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
                color: isActive ? 'var(--nav-active)' : 'var(--nav-inactive)',
                filter: isActive ? 'drop-shadow(0 0 8px var(--nav-active))' : 'none',
                transition: 'all 0.2s ease',
              }}
            />
            <span
              className="text-[10px] font-bold uppercase tracking-widest transition-all"
              style={{
                color: isActive ? 'var(--nav-active)' : 'var(--nav-inactive)',
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
