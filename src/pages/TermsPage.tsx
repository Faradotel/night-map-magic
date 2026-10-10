import { FileText, Cookie } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { openCookieBanner } from '@/components/CookieConsent';
import { TableOfContents } from '@/components/TableOfContents';
import { LegalLayout, LegalSection, ContactEmail } from '@/components/LegalLayout';
import { CONTACT_EMAIL } from '@/lib/legal';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Terms of Service | PulseMap',
  url: 'https://pulse-map.live/terms',
  dateModified: '2026-10-10',
  inLanguage: 'en',
  isPartOf: { '@type': 'WebSite', name: 'PulseMap', url: 'https://pulse-map.live/' },
};

const accent = { color: 'hsl(var(--accent))' };

export default function TermsPage() {
  return (
    <>
      <SEO
        title="Terms of Service | PulseMap"
        description="Terms of Service of PulseMap, the free live event map. Event information comes from third-party sources, tickets are sold by the source."
        canonical="/terms"
        jsonLd={[jsonLd]}
        hreflang={[
          { lang: 'en', path: '/terms' },
          { lang: 'fr', path: '/privacy-policy' },
          { lang: 'x-default', path: '/privacy-policy' },
        ]}
      />
      <LegalLayout
        icon={<FileText size={28} />}
        title="Terms of Service"
        intro="These terms govern your use of PulseMap. By using the app you agree to them."
        updated="Last updated: 10 October 2026"
        backLabel="Back to map"
      >
        <TableOfContents
          title="Contents"
          items={[
            { id: 'service', label: '1. Service' },
            { id: 'account', label: '2. Account' },
            { id: 'acceptable-use', label: '3. Acceptable use' },
            { id: 'event-data', label: '4. Event data and tickets' },
            { id: 'liability', label: '5. Liability' },
            { id: 'changes', label: '6. Changes' },
            { id: 'contact', label: '7. Contact' },
            { id: 'cookies', label: '8. Cookies and local storage' },
          ]}
        />
        <LegalSection id="service" title="1. Service">
          <p>PulseMap is a free event discovery service that displays public events on an interactive map, for personal, non-commercial use.</p>
        </LegalSection>
        <LegalSection id="account" title="2. Account">
          <p>You may create an account using email or Google sign-in. You are responsible for keeping your credentials secure and for activity on your account.</p>
        </LegalSection>
        <LegalSection id="acceptable-use" title="3. Acceptable use">
          <p>You agree not to misuse the service, extract data at scale, abuse other users, publish illegal content, or attempt to compromise the platform's security.</p>
        </LegalSection>
        <LegalSection id="event-data" title="4. Event data and tickets">
          <p>Event information (title, date, venue, link) comes from third parties: public event APIs and professional organizers. It is shown as is and is not guaranteed: schedules, prices and line-ups may change. Always check with the source.</p>
          <p>PulseMap does not sell tickets. Ticketing, full details and terms of sale remain with the source. The list of sources and their licences is on the <Link to="/sources" className="font-semibold" style={accent}>Sources and licences</Link> page, which also explains how to request removal of an event.</p>
        </LegalSection>
        <LegalSection id="liability" title="5. Liability">
          <p>The service is provided "as is" without warranty. PulseMap is not liable for any damage arising from your use of the service, from third-party event information, or from attending listed events.</p>
        </LegalSection>
        <LegalSection id="changes" title="6. Changes">
          <p>We may update these terms. Continued use of the service after changes are published constitutes acceptance of the updated terms.</p>
        </LegalSection>
        <LegalSection id="contact" title="7. Contact">
          <p>For any question regarding these terms, contact <ContactEmail email={CONTACT_EMAIL} />.</p>
        </LegalSection>
        <LegalSection id="cookies" title="8. Cookies and local storage">
          <p>PulseMap uses local browser storage for your session and preferences, and cookie-free audience measurement (Plausible). Affiliate cookies from impact.com are only set if you accept them. You can change your choice at any time.</p>
          <button type="button" onClick={openCookieBanner} className="mt-2 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors hover:bg-muted" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
            <Cookie size={14} /> Manage cookie preferences
          </button>
        </LegalSection>
      </LegalLayout>
    </>
  );
}
