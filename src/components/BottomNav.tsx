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
      className="absolute bottom-0 left-0 right-0 h-[60px] flex items-center z-[400]"
      style={{
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderTop: '1px solid var(--nav-border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 h-full flex flex-col items-center justify-center gap-0.5 relative active:scale-95 transition-transform"
          >
            {isActive && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-full"
                style={{
                  background: 'var(--nav-active)',
                  boxShadow: '0 0 10px var(--nav-active)',
                }}
              />
            )}
            <tab.icon
              size={isActive ? 24 : 22}
              strokeWidth={isActive ? 2.4 : 1.75}
              style={{
                color: isActive ? 'var(--nav-active)' : 'var(--nav-inactive)',
                filter: isActive ? 'drop-shadow(0 0 8px var(--nav-active))' : 'none',
                transform: isActive ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 0.2s cubic-bezier(0.32,0.72,0,1), color 0.2s, filter 0.2s',
              }}
            />
            <span
              className="text-[10px] font-bold uppercase tracking-wider transition-all"
              style={{
                color: isActive ? 'var(--nav-active)' : 'var(--nav-inactive)',
                opacity: isActive ? 1 : 0.85,
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
