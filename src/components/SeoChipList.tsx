import { Link } from 'react-router-dom';

interface SeoChipListProps {
  items: { to: string; label: string }[];
  columns?: 1 | 2;
}

// Quiet, plain-text internal links for the SEO boilerplate zone (other
// cities/genres/vibes/categories) — reads as "further reading," not as a
// second nav bar competing with the map CTA for clicks.
export function SeoChipList({ items, columns = 2 }: SeoChipListProps) {
  return (
    <ul className={columns === 2 ? 'grid grid-cols-2 gap-x-4 gap-y-1.5' : 'flex flex-wrap gap-x-4 gap-y-1.5'}>
      {items.map((item) => (
        <li key={item.to}>
          <Link to={item.to} className="text-sm text-muted-foreground hover:text-accent hover:underline">
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
