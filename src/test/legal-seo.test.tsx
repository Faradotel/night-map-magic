import { describe, it, expect, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import PrivacyPage from '@/pages/PrivacyPage';
import TermsPage from '@/pages/TermsPage';
import ContactLegalPage from '@/pages/ContactLegalPage';

function renderPage(Page: React.ComponentType, path: string) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <Page />
      </MemoryRouter>
    </HelmetProvider>
  );
}

function getMeta(name: string): string | null {
  const el =
    document.head.querySelector(`meta[name="${name}"]`) ||
    document.head.querySelector(`meta[property="${name}"]`);
  return el?.getAttribute('content') ?? null;
}

const pages = [
  { name: 'PrivacyPage', Component: PrivacyPage, path: '/privacy-policy' },
  { name: 'TermsPage', Component: TermsPage, path: '/terms' },
  { name: 'ContactLegalPage', Component: ContactLegalPage, path: '/contact-legal' },
];

describe('Twitter Card meta tags on legal pages', () => {
  beforeEach(() => {
    document.head.querySelectorAll('meta').forEach((m) => m.remove());
  });

  pages.forEach(({ name, Component, path }) => {
    describe(name, () => {
      beforeEach(async () => {
        renderPage(Component, path);
        await waitFor(() => {
          expect(getMeta('twitter:card')).not.toBeNull();
        });
      });

      it('declares twitter:card as summary_large_image', () => {
        expect(getMeta('twitter:card')).toBe('summary_large_image');
      });

      it('provides a non-empty twitter:title within 60 chars', () => {
        const title = getMeta('twitter:title');
        expect(title).toBeTruthy();
        expect(title!.length).toBeGreaterThan(0);
        expect(title!.length).toBeLessThanOrEqual(60);
      });

      it('provides a non-empty twitter:description within 160 chars', () => {
        const desc = getMeta('twitter:description');
        expect(desc).toBeTruthy();
        expect(desc!.length).toBeGreaterThan(0);
        expect(desc!.length).toBeLessThanOrEqual(160);
      });

      it('provides a twitter:image as absolute HTTPS URL', () => {
        const image = getMeta('twitter:image');
        expect(image).toBeTruthy();
        expect(image).toMatch(/^https:\/\//);
      });

      it('keeps twitter:title aligned with og:title', () => {
        expect(getMeta('twitter:title')).toBe(getMeta('og:title'));
      });

      it('keeps twitter:description aligned with og:description', () => {
        expect(getMeta('twitter:description')).toBe(getMeta('og:description'));
      });

      it('keeps twitter:image aligned with og:image', () => {
        expect(getMeta('twitter:image')).toBe(getMeta('og:image'));
      });
    });
  });
});
