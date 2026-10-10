import { Shield, Database, Trash2, Mail, MapPin, Users, Cookie, Server, Scale, Globe, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { openCookieBanner } from '@/components/CookieConsent';
import { TableOfContents } from '@/components/TableOfContents';
import { LegalLayout, LegalSection, Bullet, ContactEmail } from '@/components/LegalLayout';
import { CONTACT_EMAIL, LEGAL_EDITOR_NAME, LEGAL_EDITOR_STATUS, LEGAL_EDITOR_ADDRESS } from '@/lib/legal';

const LAST_UPDATED = '10 octobre 2026';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Politique de confidentialité | PulseMap',
  url: 'https://pulse-map.live/privacy-policy',
  dateModified: '2026-10-10',
  inLanguage: 'fr',
  isPartOf: { '@type': 'WebSite', name: 'PulseMap', url: 'https://pulse-map.live/' },
};

const SECTIONS = [
  { id: 'responsable', label: '1. Responsable du traitement' },
  { id: 'traitements', label: '2. Données et traitements' },
  { id: 'bases-legales', label: '3. Bases légales' },
  { id: 'geolocalisation', label: '4. Géolocalisation' },
  { id: 'partage', label: '5. Partage et sources' },
  { id: 'conservation', label: '6. Durées de conservation' },
  { id: 'hebergement', label: '7. Hébergement et transferts' },
  { id: 'cookies', label: '8. Cookies et stockage local' },
  { id: 'droits-rgpd', label: '9. Tes droits' },
  { id: 'contact', label: '10. Contact' },
];

export default function PrivacyPage() {
  return (
    <>
      <SEO
        title="Politique de confidentialité | PulseMap"
        description="Comment PulseMap traite tes données : compte, check-ins, amis, notifications, mesure d'audience sans cookie, affiliation avec consentement, durées de conservation et droits RGPD."
        canonical="/privacy-policy"
        jsonLd={[jsonLd]}
        hreflang={[
          { lang: 'fr', path: '/privacy-policy' },
          { lang: 'en', path: '/terms' },
          { lang: 'x-default', path: '/privacy-policy' },
        ]}
      />
      <LegalLayout
        icon={<Shield size={28} />}
        title="Politique de confidentialité"
        intro="PulseMap protège la vie privée de ses utilisateurs conformément au Règlement Général sur la Protection des Données (RGPD, UE 2016/679) et à la loi Informatique et Libertés."
        updated={`Dernière mise à jour : ${LAST_UPDATED}`}
      >
        <TableOfContents title="Sommaire" items={SECTIONS} />

        <LegalSection id="responsable" icon={<UserCheck size={18} />} title="1. Responsable du traitement">
          {LEGAL_EDITOR_NAME ? (
            <p>
              Le responsable du traitement est <strong className="text-foreground">{LEGAL_EDITOR_NAME}</strong>
              {LEGAL_EDITOR_STATUS && `, ${LEGAL_EDITOR_STATUS}`}{LEGAL_EDITOR_ADDRESS && `, ${LEGAL_EDITOR_ADDRESS}`}, éditeur de PulseMap.
            </p>
          ) : (
            <p>Le responsable du traitement est l'éditeur de PulseMap.</p>
          )}
          <p>Contact pour toute question relative à tes données : <ContactEmail email={CONTACT_EMAIL} />.</p>
        </LegalSection>

        <LegalSection id="traitements" icon={<Database size={18} />} title="2. Données et traitements">
          <ul className="space-y-1.5">
            <Bullet label="Compte">Email, mot de passe (stocké chiffré), pseudo et ville préférée, pour créer et sécuriser ton compte et afficher les événements de ta ville.</Bullet>
            <Bullet label="Check-ins">Les événements auxquels tu indiques participer, pour ton historique et tes badges.</Bullet>
            <Bullet label="Amis">Les demandes et liens d'amitié que tu acceptes, et les notifications associées.</Bullet>
            <Bullet label="Notifications push">Si tu les actives, l'abonnement push de ton navigateur (adresse technique et clés de chiffrement) est enregistré pour t'envoyer des alertes, ainsi que tes préférences de notification.</Bullet>
            <Bullet label="Mesure d'audience">Plausible Analytics, sans cookie et sans donnée permettant de t'identifier, pour compter les visites de façon agrégée.</Bullet>
            <Bullet label="Affiliation">Uniquement si tu acceptes les cookies : le tag impact.com peut déposer des cookies pour mesurer les visites vers certains partenaires. Sans consentement, aucun script impact.com n'est chargé.</Bullet>
          </ul>
          <p className="font-semibold text-foreground">Aucune donnée personnelle n'est vendue ni louée.</p>
        </LegalSection>

        <LegalSection id="bases-legales" icon={<Scale size={18} />} title="3. Bases légales">
          <ul className="space-y-1.5">
            <Bullet label="Exécution du service">compte, check-ins, amis et notifications liées à ton compte.</Bullet>
            <Bullet label="Consentement">notifications push et cookies d'affiliation impact.com, retirables à tout moment.</Bullet>
            <Bullet label="Intérêt légitime">mesure d'audience sans cookie, sécurité du service.</Bullet>
          </ul>
        </LegalSection>

        <LegalSection id="geolocalisation" icon={<MapPin size={18} />} title="4. Géolocalisation">
          <p>Ta position sert à afficher les événements proches. Elle est traitée <strong className="text-foreground">localement dans ton navigateur</strong> et n'est ni transmise ni stockée sur nos serveurs. Tu peux la refuser et utiliser le mode Ville.</p>
        </LegalSection>

        <LegalSection id="partage" icon={<Users size={18} />} title="5. Partage et sources">
          <ul className="space-y-1.5">
            <Bullet label="Pseudo">visible par les autres utilisateurs (recherche d'amis).</Bullet>
            <Bullet label="Check-ins">visibles par toi et tes amis confirmés.</Bullet>
            <Bullet label="Email">jamais affiché publiquement.</Bullet>
          </ul>
          <p>
            Les données d'événements proviennent de sources tierces listées sur la page{' '}
            <Link to="/sources" className="font-semibold" style={{ color: 'hsl(var(--accent))' }}>Sources et licences</Link>, et sont affichées en l'état.
          </p>
        </LegalSection>

        <LegalSection id="conservation" icon={<Server size={18} />} title="6. Durées de conservation">
          <ul className="space-y-1.5">
            <Bullet label="Compte, check-ins, amis">tant que le compte est actif, puis suppression sous 30 jours après la suppression du compte.</Bullet>
            <Bullet label="Abonnement push">jusqu'à la désactivation des notifications ou la suppression du compte.</Bullet>
            <Bullet label="Notifications">supprimées avec le compte.</Bullet>
            <Bullet label="Choix cookies">conservé dans ton navigateur jusqu'à ce que tu le modifies.</Bullet>
            <Bullet label="Cookies impact.com">selon la durée fixée par impact.com, au plus 13 mois conformément aux recommandations de la CNIL.</Bullet>
          </ul>
        </LegalSection>

        <LegalSection id="hebergement" icon={<Globe size={18} />} title="7. Hébergement et transferts">
          <p>Le site et la base de données sont hébergés par Lovable Cloud, qui s'appuie sur l'infrastructure Supabase. Les communications sont chiffrées (HTTPS/TLS) et l'accès aux données est protégé par des règles de sécurité au niveau de la base.</p>
          <p>impact.com est une société établie aux États-Unis : si tu acceptes ses cookies, des données de navigation peuvent être transférées hors de l'Union européenne, encadrées par les clauses contractuelles types de la Commission européenne ou le Data Privacy Framework.</p>
        </LegalSection>

        <LegalSection id="cookies" icon={<Cookie size={18} />} title="8. Cookies et stockage local">
          <p>Le stockage local du navigateur conserve ta session et tes préférences (thème, ville, unité de distance). La mesure d'audience Plausible n'utilise aucun cookie. Les cookies d'affiliation impact.com ne sont déposés qu'après ton accord.</p>
          <button type="button" onClick={openCookieBanner} className="mt-2 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors hover:bg-muted" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
            <Cookie size={14} /> Gérer mes préférences cookies
          </button>
        </LegalSection>

        <LegalSection id="droits-rgpd" icon={<Trash2 size={18} />} title="9. Tes droits">
          <p>Tu disposes des droits d'accès, de rectification, d'effacement, de portabilité, d'opposition, de limitation et de retrait du consentement. Tu peux supprimer ton compte depuis ton profil. Réponse sous 30 jours maximum.</p>
        </LegalSection>

        <LegalSection id="contact" icon={<Mail size={18} />} title="10. Contact">
          <p>Pour exercer tes droits : <ContactEmail email={CONTACT_EMAIL} />.</p>
          <p>Tu peux aussi adresser une réclamation à la CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline">www.cnil.fr</a>.</p>
        </LegalSection>
      </LegalLayout>
    </>
  );
}
