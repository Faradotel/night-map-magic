import { Navigate } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { LegalLayout, LegalSection, ContactEmail } from '@/components/LegalLayout';
import {
  LEGAL_INFO_COMPLETE, LEGAL_EDITOR_NAME, LEGAL_EDITOR_STATUS, LEGAL_EDITOR_ADDRESS,
  CONTACT_EMAIL, HOST_NAME, HOST_ADDRESS,
} from '@/lib/legal';

export default function MentionsLegalesPage() {
  // Informations non renseignees : pas de page "a completer", on renvoie vers les conditions.
  if (!LEGAL_INFO_COMPLETE) return <Navigate to="/terms" replace />;

  return (
    <>
      <SEO title="Mentions légales | PulseMap" description="Mentions légales de PulseMap : éditeur, directeur de publication, hébergeur et contact." canonical="/mentions-legales" />
      <LegalLayout icon={<Scale size={28} />} title="Mentions légales">
        <LegalSection title="Éditeur">
          <p><strong className="text-foreground">{LEGAL_EDITOR_NAME}</strong>{LEGAL_EDITOR_STATUS && `, ${LEGAL_EDITOR_STATUS}`}</p>
          {LEGAL_EDITOR_ADDRESS && <p>{LEGAL_EDITOR_ADDRESS}</p>}
        </LegalSection>
        <LegalSection title="Directeur de la publication">
          <p>{LEGAL_EDITOR_NAME}</p>
        </LegalSection>
        <LegalSection title="Hébergeur">
          <p>{HOST_NAME || 'Lovable Cloud'}</p>
          {HOST_ADDRESS && <p>{HOST_ADDRESS}</p>}
        </LegalSection>
        <LegalSection title="Contact">
          <p>Pour toute question : <ContactEmail email={CONTACT_EMAIL} />.</p>
        </LegalSection>
        <LegalSection title="Propriété intellectuelle">
          <p>
            La marque PulseMap, le site, son code et ses contenus originaux sont protégés. Les informations
            d'événements, textes et images appartiennent à leurs auteurs et sources respectives, listées sur la
            page <a href="/sources" className="font-semibold" style={{ color: 'hsl(var(--accent))' }}>Sources et licences</a>.
            Les données cartographiques sont © OpenStreetMap contributors.
          </p>
        </LegalSection>
      </LegalLayout>
    </>
  );
}
