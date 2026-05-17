import { ArrowLeft, FileText, HelpCircle, Cookie } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { Link } from 'react-router-dom';
import { BackButton, useSwipeBack } from '@/components/BackButton';
import { openCookieBanner } from '@/components/CookieConsent';

const faqs = [
  {
    q: 'Is PulseMap free to use?',
    a: 'Yes. PulseMap is free for personal, non-commercial use. No subscription, no hidden fees.',
  },
  {
    q: 'Do I need an account to view the event map?',
    a: 'No. The interactive map and event browsing are fully accessible without signing in. An account is only required for social features (friends, check-ins, badges).',
  },
  {
    q: 'Where does the event data come from?',
    a: 'Events are aggregated from public third-party sources such as Shotgun, Ticketmaster, OpenAgenda and Meetup. PulseMap does not organize these events itself.',
  },
  {
    q: 'Can I report inaccurate or inappropriate content?',
    a: 'Yes. Contact privacy@pulsemap.app and we will review the report within 7 days.',
  },
  {
    q: 'Does PulseMap use tracking cookies?',
    a: 'No. PulseMap only uses local browser storage to keep your session and preferences. No third-party advertising or analytics cookies are used.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'PulseMap',
  url: 'https://pulse-map.live/',
  logo: {
    '@type': 'ImageObject',
    url: 'https://pulse-map.live/icon-512.png',
    width: 512,
    height: 512,
    caption: 'PulseMap logo',
  },
  email: 'privacy@pulsemap.app',
  sameAs: ['https://pulse-map.live/'],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Terms of Service — PulseMap',
  description: 'Terms of Service for PulseMap, the live event map application.',
  url: 'https://pulse-map.live/terms',
  dateModified: '2026-05-15',
  inLanguage: 'en',
  isPartOf: {
    '@type': 'WebSite',
    name: 'PulseMap',
    url: 'https://pulse-map.live/',
  },
  about: orgJsonLd,
};

export default function TermsPage() {
  return (
    <>
      <SEO
        title="Terms of Service — PulseMap"
        description="Read the Terms of Service governing your use of PulseMap, the free live event discovery map. No tracking, privacy first."
        ogTitle="Terms of Service — PulseMap | Free Event Discovery"
        ogDescription="Read the terms governing your use of PulseMap. Free, privacy-first event discovery. No tracking, no hidden fees."
        canonical="/terms"
        jsonLd={[orgJsonLd, jsonLd, faqJsonLd]}
        hreflang={[
          { lang: 'en', path: '/terms' },
          { lang: 'fr', path: '/privacy-policy' },
          { lang: 'x-default', path: '/privacy-policy' },
        ]}
        imageWidth={512}
        imageHeight={512}
        imageAlt="PulseMap logo"
      />

      <div className="h-full overflow-y-auto" style={{ background: 'hsl(var(--background))' }}>
        <nav
          className="sticky top-0 z-50 border-b px-4 py-3"
          style={{
            background: 'hsl(var(--background) / 0.85)',
            backdropFilter: 'blur(12px)',
            borderColor: 'hsl(var(--border))',
          }}
        >
          <div className="mx-auto max-w-3xl flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              <ArrowLeft size={16} />
              Back to map
            </Link>
            <span
              className="ml-auto text-xs font-bold tracking-widest uppercase"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              PulseMap
            </span>
          </div>
        </nav>

        <header className="relative px-4 pt-12 pb-8">
          <div className="mx-auto max-w-3xl text-center">
            <div
              className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: 'hsl(var(--accent) / 0.12)' }}
            >
              <FileText size={28} style={{ color: 'hsl(var(--accent))' }} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Terms of Service
            </h1>
            <p
              className="mt-3 text-sm leading-relaxed"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              These terms govern your use of PulseMap. By using the app you agree to them.
            </p>
            <p
              className="mt-2 text-xs font-medium"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              Last updated: 15 May 2026
            </p>
          </div>
        </header>

        <main className="px-4 pb-20">
          <div className="mx-auto max-w-3xl space-y-6 text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <Section title="1. Service">
              PulseMap is a live event discovery platform that displays public events on an
              interactive map. The service is provided free of charge for personal,
              non-commercial use.
            </Section>
            <Section title="2. Account">
              You may create an account using email or Google sign-in. You are responsible for
              keeping your credentials secure and for activity on your account.
            </Section>
            <Section title="3. Acceptable use">
              You agree not to misuse the service, scrape data at scale, abuse other users,
              publish illegal content, or attempt to compromise the platform's security.
            </Section>
            <Section title="4. Event data">
              Event information is aggregated from public third-party sources. PulseMap does
              not guarantee the accuracy, availability or quality of any listed event.
            </Section>
            <Section title="5. Liability">
              The service is provided "as is" without warranty. PulseMap is not liable for any
              damage arising from your use of the service or attendance to events listed.
            </Section>
            <Section title="6. Changes">
              We may update these terms at any time. Continued use of the service after changes
              are published constitutes acceptance of the updated terms.
            </Section>
            <Section title="7. Contact">
              For any question regarding these terms, contact{' '}
              <a
                href="mailto:privacy@pulsemap.app"
                className="font-semibold"
                style={{ color: 'hsl(var(--accent))' }}
              >
                privacy@pulsemap.app
              </a>
              .
            </Section>

            <section
              className="rounded-2xl border p-5"
              style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
            >
              <div className="mb-3 flex items-center gap-2">
                <Cookie size={16} style={{ color: 'hsl(var(--accent))' }} />
                <h2 className="text-base font-bold text-foreground">8. Cookies & local storage</h2>
              </div>
              <p>
                PulseMap only uses local browser storage to keep your session and preferences. No
                third-party tracking or advertising cookies are used. You can review and change
                your consent at any time.
              </p>
              <button
                type="button"
                onClick={openCookieBanner}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors hover:bg-muted"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              >
                <Cookie size={14} />
                Manage cookie preferences
              </button>
            </section>

            <section
              className="rounded-2xl border p-5"
              style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
            >
              <div className="mb-3 flex items-center gap-2">
                <HelpCircle size={16} style={{ color: 'hsl(var(--accent))' }} />
                <h2 className="text-base font-bold text-foreground">Frequently asked questions</h2>
              </div>
              <div className="space-y-2">
                {faqs.map((f, i) => (
                  <details
                    key={i}
                    className="group rounded-xl border p-3 transition-colors open:bg-muted/40"
                    style={{ borderColor: 'hsl(var(--border))' }}
                  >
                    <summary className="cursor-pointer list-none text-sm font-semibold text-foreground flex items-center justify-between gap-2">
                      <span>{f.q}</span>
                      <span
                        className="text-lg leading-none transition-transform group-open:rotate-45"
                        style={{ color: 'hsl(var(--accent))' }}
                        aria-hidden
                      >
                        +
                      </span>
                    </summary>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {f.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          </div>
        </main>

        <footer
          className="border-t px-4 py-8"
          style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
        >
          <div className="mx-auto max-w-3xl flex flex-col items-center gap-3 text-center">
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              © 2026 PulseMap. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <a href="/" className="hover:text-foreground transition-colors">Home</a>
              <span style={{ color: 'hsl(var(--border))' }}>|</span>
              <a href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <span style={{ color: 'hsl(var(--border))' }}>|</span>
              <a href="/contact-legal" className="hover:text-foreground transition-colors">Legal contact</a>
              <span style={{ color: 'hsl(var(--border))' }}>|</span>
              <span style={{ color: 'hsl(var(--foreground))' }}>Terms</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl border p-5"
      style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
    >
      <h2 className="mb-2 text-base font-bold text-foreground">{title}</h2>
      <p>{children}</p>
    </section>
  );
}
