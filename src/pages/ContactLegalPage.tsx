import { Mail, Shield, User, MapPin, Building, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { LegalLayout, LegalSection, ContactEmail } from '@/components/LegalLayout';
import { CONTACT_EMAIL, LEGAL_EDITOR_NAME, LEGAL_INFO_COMPLETE } from '@/lib/legal';

const accent = { color: 'hsl(var(--accent))' };

export default function ContactLegalPage() {
  return (
    <>
      <SEO
        title="Contact légal | PulseMap"
        description="Contact légal de PulseMap : responsable du traitement, exercice des droits RGPD, retrait d'un événement et réclamation CNIL."
        canonical="/contact-legal"
        hreflang={[
          { lang: 'fr', path: '/contact-legal' },
          { lang: 'x-default', path: '/contact-legal' },
        ]}
      />
      <LegalLayout
        icon={<Shield size={28} />}
        title="Contact légal"
        intro="Éditeur, responsable du traitement et moyens de contact pour exercer tes droits ou signaler un contenu."
      >
        <LegalSection icon={<Building size={18} />} title="Éditeur">
          <p>
            PulseMap est une carte d'événements en temps réel éditée par {LEGAL_EDITOR_NAME ? <strong className="text-foreground">{LEGAL_EDITOR_NAME}</strong> : "l'équipe PulseMap"}, en France.
            {LEGAL_INFO_COMPLETE && <> Voir les <Link to="/mentions-legales" className="font-semibold" style={accent}>mentions légales</Link>.</>}
          </p>
          {CONTACT_EMAIL && <p>Email : <ContactEmail email={CONTACT_EMAIL} /></p>}
        </LegalSection>

        <LegalSection icon={<User size={18} />} title="Responsable du traitement">
          <p>Pour toute question sur tes données ou pour exercer tes droits (accès, rectification, effacement, portabilité, opposition){CONTACT_EMAIL ? <>, écris à <ContactEmail email={CONTACT_EMAIL} /></> : null}. Délai de réponse : 30 jours maximum.</p>
          {CONTACT_EMAIL && (
            <a href={`mailto:${CONTACT_EMAIL}`} className="mt-1 inline-flex items-center gap-2 rounded-xl border px-4 py-2 font-semibold text-foreground" style={{ borderColor: 'hsl(var(--border))' }}>
              <Mail size={16} style={accent} /> {CONTACT_EMAIL}
            </a>
          )}
        </LegalSection>

        <LegalSection icon={<Database size={18} />} title="Événements et retrait d'un contenu">
          <p>Les informations d'événements viennent de tiers et ne sont pas garanties. La billetterie et le détail restent chez la source. Un organisateur ou ayant droit peut demander le retrait d'un événement, traité sous 24 heures : voir <Link to="/sources#retrait" className="font-semibold" style={accent}>Sources et licences</Link>.</p>
        </LegalSection>

        <LegalSection icon={<MapPin size={18} />} title="Réclamation auprès de la CNIL">
          <p>Si tu estimes que tes droits ne sont pas respectés, tu peux saisir la CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="font-medium underline" style={accent}>www.cnil.fr</a>.</p>
        </LegalSection>

        <LegalSection icon={<Shield size={18} />} title="Hébergement et sécurité">
          <p>Le site et les données sont hébergés par Lovable Cloud (infrastructure Supabase). Communications chiffrées en HTTPS/TLS, mots de passe jamais stockés en clair. Détails dans la <Link to="/privacy-policy" className="font-semibold" style={accent}>politique de confidentialité</Link>.</p>
        </LegalSection>
      </LegalLayout>
    </>
  );
}
