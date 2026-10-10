import { Database, ExternalLink, Trash2, AlertTriangle } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { LegalLayout, LegalSection, Bullet } from '@/components/LegalLayout';
import {
  SOURCE_ENTRIES, SOURCES_INTRO, SOURCES_DISCLAIMER, SOURCES_META, SOURCES_LAST_UPDATED, takedownText,
} from '@/lib/seo/sourcesContent';

export default function SourcesPage() {
  return (
    <>
      <SEO title={SOURCES_META.title} description={SOURCES_META.description} canonical={SOURCES_META.canonical} />
      <LegalLayout
        icon={<Database size={28} />}
        title={SOURCES_META.h1}
        intro={SOURCES_INTRO}
        updated={`Dernière mise à jour : ${SOURCES_LAST_UPDATED}`}
      >
        {SOURCE_ENTRIES.map((s) => (
          <LegalSection key={s.name} title={s.name}>
            <ul className="space-y-1.5">
              <Bullet label="Origine">{s.role}</Bullet>
              <Bullet label="Ce que PulseMap affiche">{s.shown}</Bullet>
              <Bullet label="Licence et conditions">{s.license}</Bullet>
            </ul>
            <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: 'hsl(var(--accent))' }}>
              {s.url.replace(/^https?:\/\//, '')} <ExternalLink size={11} aria-hidden="true" />
            </a>
          </LegalSection>
        ))}
        <LegalSection icon={<AlertTriangle size={18} />} title="Exactitude des informations">
          <p>{SOURCES_DISCLAIMER}</p>
        </LegalSection>
        <LegalSection id="retrait" icon={<Trash2 size={18} />} title="Retrait d'un contenu">
          <p>{takedownText()}</p>
        </LegalSection>
      </LegalLayout>
    </>
  );
}
