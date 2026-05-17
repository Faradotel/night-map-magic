import { List } from 'lucide-react';

interface TOCItem {
  id: string;
  label: string;
}

interface TableOfContentsProps {
  items: TOCItem[];
  title?: string;
}

export function TableOfContents({ items, title = 'Table des matières' }: TableOfContentsProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav
      className="rounded-2xl border p-5 mb-4"
      style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <List size={16} style={{ color: 'hsl(var(--accent))' }} />
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              className="block text-xs font-medium rounded-lg px-2.5 py-1.5 transition-colors hover:bg-muted"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
