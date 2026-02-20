import { Map, Search, User } from 'lucide-react';

type Tab = 'map' | 'search' | 'profile';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs: { id: Tab; icon: typeof Map; label: string }[] = [
    { id: 'map', icon: Map, label: 'Carte' },
    { id: 'search', icon: Search, label: 'Recherche' },
    { id: 'profile', icon: User, label: 'Profil' },
  ];

  return (
    <nav
      className="absolute bottom-0 left-0 right-0 h-16 flex items-center z-[400]"
      style={{
        background: 'hsl(258 55% 9% / 0.97)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid hsl(258 40% 18%)',
        boxShadow: '0 -4px 24px hsl(258 60% 4% / 0.6)',
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
            <div
              className="relative flex items-center justify-center"
              style={{ transition: 'all 0.2s ease' }}
            >
              {isActive && (
                <div
                  className="absolute inset-[-4px] rounded-full opacity-30"
                  style={{ background: 'hsl(183 100% 50%)' }}
                />
              )}
              <tab.icon
                size={20}
                style={{
                  color: isActive ? 'hsl(183 100% 50%)' : 'hsl(258 20% 50%)',
                  filter: isActive ? 'drop-shadow(0 0 6px hsl(183 100% 50% / 0.8))' : 'none',
                  transition: 'all 0.2s ease',
                }}
              />
            </div>
            <span
              className="text-[10px] font-semibold transition-all"
              style={{
                color: isActive ? 'hsl(183 100% 50%)' : 'hsl(258 20% 50%)',
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
