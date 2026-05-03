import { useHotspots } from '@/hooks/useHotspots';
import { Flame, Users, ChevronRight } from 'lucide-react';
import { NightEvent } from '@/data/mockEvents';

interface TonightsHotspotsBannerProps {
  allEvents: NightEvent[];
  onSelect: (event: NightEvent) => void;
  /** Affiché uniquement si visible (par ex. quand le mode carte est actif et aucun panel ouvert). */
  visible: boolean;
}

/**
 * Banner qui met en avant les events chauds ce soir + là où les amis vont.
 * Scrollable horizontalement, très compact, s'intègre en haut de la map.
 */
export function TonightsHotspotsBanner({ allEvents, onSelect, visible }: TonightsHotspotsBannerProps) {
  const { tonight, friendHotspots, loading } = useHotspots({ tonightLimit: 5, minFriends: 2 });

  if (!visible) return null;
  if (loading) return null;
  if (tonight.length === 0 && friendHotspots.length === 0) return null;

  // Build merged list: friend hotspots first (priority), then tonight hotspots
  type BannerItem = {
    eventId: string;
    title: string;
    subtitle: string;
    badge: string;
    badgeColor: string;
    icon: 'friends' | 'flame';
  };

  const friendItems: BannerItem[] = friendHotspots.slice(0, 3).map(h => ({
    eventId: h.event_id,
    title: h.event_name,
    subtitle: h.event_city,
    badge: `${h.friend_count} ami${h.friend_count > 1 ? 's' : ''}`,
    badgeColor: 'hsl(325, 89%, 50%)',
    icon: 'friends',
  }));

  const tonightItems: BannerItem[] = tonight
    .filter(h => !friendItems.some(f => f.eventId === h.event_id))
    .slice(0, 5)
    .map(h => ({
      eventId: h.event_id,
      title: h.event_name,
      subtitle: h.event_city,
      badge: `${h.check_ins} go`,
      badgeColor: 'hsl(142, 71%, 45%)',
      icon: 'flame',
    }));

  const items = [...friendItems, ...tonightItems].slice(0, 6);
  if (items.length === 0) return null;

  const handleClick = (item: BannerItem) => {
    const fullEvent = allEvents.find(e => e.id === item.eventId);
    if (fullEvent) {
      onSelect(fullEvent);
    }
  };

  return (
    <div className="pointer-events-auto absolute left-0 right-0 top-14 z-[400] px-3">
      <div className="mb-1.5 flex items-center gap-1.5 px-1">
        <Flame size={12} style={{ color: 'hsl(142, 71%, 45%)' }} />
        <span className="text-[10px] font-black uppercase tracking-wider text-foreground/80">
          Hot maintenant
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-1 -mx-1 px-1">
        {items.map(item => (
          <button
            key={item.eventId}
            onClick={() => handleClick(item)}
            className="shrink-0 min-w-[180px] max-w-[220px] rounded-2xl p-2.5 text-left transition-transform active:scale-95"
            style={{
              background: 'hsl(var(--background) / 0.9)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${item.badgeColor}55`,
              boxShadow: `0 4px 20px ${item.badgeColor}22`,
            }}
          >
            <div className="mb-1 flex items-center gap-1">
              <span
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider"
                style={{ background: `${item.badgeColor}22`, color: item.badgeColor }}
              >
                {item.icon === 'friends' ? <Users size={8} /> : <Flame size={8} />}
                {item.badge}
              </span>
            </div>
            <p className="truncate text-xs font-bold text-foreground">{item.title}</p>
            <div className="mt-0.5 flex items-center justify-between">
              <p className="truncate text-[10px] text-muted-foreground">{item.subtitle}</p>
              <ChevronRight size={10} className="shrink-0 text-muted-foreground" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
