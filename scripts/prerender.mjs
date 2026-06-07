#!/usr/bin/env node
/**
 * Build-time prerender for SEO routes.
 *
 * Reads `dist/index.html` (built by `vite build`), then for each SEO route
 * generates `dist/<path>/index.html` with the full static HTML (title, meta,
 * canonical, H1, intro, event list, FAQ, JSON-LD) injected into the `<head>`
 * and `#root`. The SPA still boots via `<script type="module" src=...>` —
 * because `src/main.tsx` uses `createRoot().render()` (not `hydrateRoot`),
 * React replaces the prerendered #root content cleanly with no hydration
 * mismatch. Users get the SPA; Googlebot gets static HTML.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');

const SITE = 'https://pulse-map.live';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rhzojoyxldrllxroyyqt.supabase.co';
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoem9qb3l4bGRybGx4cm95eXF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1OTgzMzMsImV4cCI6MjA4NzE3NDMzM30.F4diHNQzCVEnNeuJo4yt_XTky7Eme4gT1rDfvmzHy24';

const CITIES = {
  paris: 'Paris', lyon: 'Lyon', marseille: 'Marseille', toulouse: 'Toulouse',
  nice: 'Nice', nantes: 'Nantes', bordeaux: 'Bordeaux', grenoble: 'Grenoble',
  lille: 'Lille', strasbourg: 'Strasbourg', rennes: 'Rennes',
  montpellier: 'Montpellier', 'aix-en-provence': 'Aix-en-Provence',
  'saint-etienne': 'Saint-Étienne', villeurbanne: 'Villeurbanne',
};

const CATEGORIES = {
  concerts: 'Concerts', soirees: 'Soirées', festivals: 'Festivals',
  bars: 'Bars', sport: 'Sport', culture: 'Culture', brocantes: 'Brocantes',
};

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function slugifyEvent(name, id) {
  const base = String(name || 'event').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  return `${base}-${id}`;
}

async function fetchCityEvents(cityName) {
  const nowIso = new Date().toISOString();
  const url =
    `${SUPABASE_URL}/rest/v1/cached_events` +
    `?select=id,name,city,venue,address,start_time,end_time,description,image_url,ticket_url,price_range,type,lat,lng` +
    `&city=ilike.${encodeURIComponent(cityName)}` +
    `&or=(start_time.gte.${nowIso},end_time.gte.${nowIso})` +
    `&order=start_time.asc&limit=30`;
  try {
    const r = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!r.ok) return [];
    return await r.json();
  } catch {
    return [];
  }
}

function buildCityPage({ slug, cityName, isSortir, events }) {
  const canonical = `${SITE}/sortir-ce-soir/${slug}`;
  const title = isSortir
    ? `Où sortir ce soir à ${cityName} ? Concerts, soirées & bars`
    : `Sortir ce soir à ${cityName} : que faire ? | PulseMap`;
  const description =
    `Où sortir ce soir à ${cityName} ? Carte temps réel des concerts, soirées, ` +
    `clubs, festivals et bars animés ouverts ce soir à ${cityName}. Gratuit, sans inscription.`;

  const faqs = [
    {
      q: `Où sortir ce soir à ${cityName} ?`,
      a: `Pour sortir ce soir à ${cityName}, PulseMap affiche en temps réel tous les concerts, soirées, clubs, bars animés et festivals ouverts ce soir à ${cityName} sur une carte interactive.`,
    },
    {
      q: `Que faire ce soir à ${cityName} ?`,
      a: `Ce soir à ${cityName}, tu peux profiter de concerts live, soirées électro et techno, clubs, afterworks, festivals, expos nocturnes ou simplement un bar animé.`,
    },
    {
      q: `Comment trouver une soirée ce soir à ${cityName} ?`,
      a: `Ouvre PulseMap, sélectionne ${cityName} et active le filtre « ce soir ». La carte affiche toutes les soirées disponibles avec horaires, lieu et billetterie.`,
    },
    {
      q: `PulseMap est-il gratuit pour découvrir les sorties à ${cityName} ?`,
      a: `Oui, PulseMap est 100 % gratuit. Tu peux consulter la carte des sorties à ${cityName} sans inscription.`,
    },
  ];

  const eventsHtml = events.length
    ? `<ul>${events.map(e => `
      <li><a href="/evenements/${esc(slugifyEvent(e.name, e.id))}">
        <strong>${esc(e.name)}</strong> — ${esc(e.venue || '')} ·
        ${esc(new Date(e.start_time).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))}
      </a></li>`).join('')}</ul>`
    : `<p>Aucun événement référencé pour le moment à ${esc(cityName)}.</p>`;

  const otherCities = Object.entries(CITIES).filter(([s]) => s !== slug)
    .map(([s, n]) => `<a href="/sortir-ce-soir/${s}">${esc(n)}</a>`).join(' · ');

  const cats = Object.entries(CATEGORIES)
    .map(([cs, cl]) => `<a href="/categories/${cs}/${slug}">${esc(cl)} à ${esc(cityName)}</a>`).join(' · ');

  const body = `
<main>
  <nav aria-label="Fil d'ariane"><a href="/">Accueil</a> / <a href="/villes">Villes</a> / <span>${esc(cityName)}</span></nav>
  <h1>Où sortir ce soir à ${esc(cityName)} ?</h1>
  <p>Tu cherches <strong>où sortir ce soir à ${esc(cityName)}</strong> ? PulseMap référence en temps réel tous les concerts, soirées, clubs, festivals et bars animés ouverts ce soir à ${esc(cityName)}. La carte interactive te montre instantanément les meilleures sorties autour de toi, avec horaires, lieux et liens billetterie.</p>
  <p><a href="/?city=${encodeURIComponent(cityName)}">Voir la carte des sorties ce soir à ${esc(cityName)}</a></p>
  <section><h2>Sorties ce soir à ${esc(cityName)} — prochains événements</h2>${eventsHtml}</section>
  <section><h2>Par type de sortie à ${esc(cityName)}</h2><p>${cats}</p></section>
  <section><h2>Sortir ce soir dans d'autres villes</h2><p>${otherCities}</p></section>
  <section><h2>Questions fréquentes — sortir ce soir à ${esc(cityName)}</h2>
    ${faqs.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
  </section>
</main>`;

  const faqLd = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Villes', item: `${SITE}/villes` },
      { '@type': 'ListItem', position: 3, name: cityName, item: canonical },
    ],
  };
  const placeLd = {
    '@context': 'https://schema.org', '@type': 'City',
    name: cityName, address: { '@type': 'PostalAddress', addressLocality: cityName, addressCountry: 'FR' },
  };
  const eventsLd = events.slice(0, 15).map(e => ({
    '@context': 'https://schema.org', '@type': 'Event',
    name: e.name, startDate: e.start_time, endDate: e.end_time || undefined,
    description: e.description || undefined, image: e.image_url || undefined,
    url: `${SITE}/evenements/${slugifyEvent(e.name, e.id)}`,
    location: { '@type': 'Place', name: e.venue || cityName,
      address: { '@type': 'PostalAddress', streetAddress: e.address || undefined,
        addressLocality: e.city || cityName, addressCountry: 'FR' } },
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  }));

  return { title, description, canonical, body, jsonLd: [placeLd, breadcrumbLd, faqLd, ...eventsLd] };
}

function buildCategoryPage({ catSlug, catLabel, citySlug, cityName }) {
  const path = citySlug ? `/categories/${catSlug}/${citySlug}` : `/categories/${catSlug}`;
  const where = cityName ? ` à ${cityName}` : '';
  const title = `${catLabel}${where} — sortir ce soir | PulseMap`;
  const description = `Découvre les meilleurs ${catLabel.toLowerCase()}${where} ce soir sur PulseMap. Carte interactive temps réel, gratuit et sans inscription.`;
  const body = `<main>
    <nav><a href="/">Accueil</a> / <a href="/categories/${catSlug}">${esc(catLabel)}</a>${cityName ? ` / <span>${esc(cityName)}</span>` : ''}</nav>
    <h1>${esc(catLabel)}${esc(where)} ce soir</h1>
    <p>Tu cherches des <strong>${esc(catLabel.toLowerCase())}${esc(where)}</strong> ? PulseMap te montre en temps réel toutes les sorties disponibles près de chez toi, avec horaires, lieu et billetterie.</p>
    <p><a href="/${cityName ? `?city=${encodeURIComponent(cityName)}` : ''}">Voir la carte</a></p>
    <section><h2>Sortir dans d'autres villes</h2>
      <p>${Object.entries(CITIES).map(([s, n]) => `<a href="/categories/${catSlug}/${s}">${esc(catLabel)} à ${esc(n)}</a>`).join(' · ')}</p>
    </section>
  </main>`;
  return { title, description, canonical: `${SITE}${path}`, body, jsonLd: [] };
}

function buildVillesIndex() {
  const title = 'Toutes les villes — sortir ce soir | PulseMap';
  const description = 'Découvre où sortir ce soir dans toutes les grandes villes de France. Concerts, soirées, clubs et bars en temps réel.';
  const body = `<main>
    <h1>Sortir ce soir — toutes les villes</h1>
    <p>Choisis ta ville pour découvrir les sorties ce soir près de chez toi.</p>
    <ul>${Object.entries(CITIES).map(([s, n]) => `<li><a href="/sortir-ce-soir/${s}">Sortir ce soir à ${esc(n)}</a></li>`).join('')}</ul>
  </main>`;
  return { title, description, canonical: `${SITE}/villes`, body, jsonLd: [] };
}

function injectIntoTemplate(template, { title, description, canonical, body, jsonLd }) {
  let html = template;
  // Replace <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`);
  // Replace meta description
  html = html.replace(
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${esc(description)}" />`,
  );
  // og:title / og:description / og:url
  html = html.replace(
    /<meta\s+property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${esc(title)}" />`,
  );
  html = html.replace(
    /<meta\s+property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${esc(description)}" />`,
  );
  html = html.replace(
    /<meta\s+property=["']og:url["'][^>]*>/i,
    `<meta property="og:url" content="${esc(canonical)}" />`,
  );

  // Insert canonical + json-ld before </head>
  const ldTags = (jsonLd || [])
    .map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`)
    .join('\n');
  const headInject = `<link rel="canonical" href="${esc(canonical)}" />\n${ldTags}\n`;
  html = html.replace('</head>', `${headInject}</head>`);

  // Inject body content into #root (will be replaced by React on hydration, fine for SEO)
  html = html.replace(
    /<div id="root"><\/div>/,
    `<div id="root"><div data-prerender style="position:absolute;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;">${body}</div></div>`,
  );
  return html;
}

async function writeRoute(routePath, html) {
  const dir = path.join(distDir, routePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
}

async function main() {
  if (!fs.existsSync(indexHtmlPath)) {
    console.error('[prerender] dist/index.html not found — run vite build first');
    process.exit(0); // don't fail the build
  }
  const template = fs.readFileSync(indexHtmlPath, 'utf8');
  let count = 0;

  // /villes index
  await writeRoute('villes', injectIntoTemplate(template, buildVillesIndex()));
  count++;

  // /villes/<slug> and /sortir-ce-soir/<slug> — fetch in parallel
  const cityEntries = Object.entries(CITIES);
  const cityResults = await Promise.all(
    cityEntries.map(async ([slug, name]) => [slug, name, await fetchCityEvents(name)]),
  );

  for (const [slug, cityName, events] of cityResults) {
    const villesPage = buildCityPage({ slug, cityName, isSortir: false, events });
    const sortirPage = buildCityPage({ slug, cityName, isSortir: true, events });
    await writeRoute(`villes/${slug}`, injectIntoTemplate(template, villesPage));
    await writeRoute(`sortir-ce-soir/${slug}`, injectIntoTemplate(template, sortirPage));
    count += 2;
  }

  // /categories/<cat> and /categories/<cat>/<city>
  for (const [catSlug, catLabel] of Object.entries(CATEGORIES)) {
    await writeRoute(
      `categories/${catSlug}`,
      injectIntoTemplate(template, buildCategoryPage({ catSlug, catLabel })),
    );
    count++;
    for (const [citySlug, cityName] of cityEntries) {
      await writeRoute(
        `categories/${catSlug}/${citySlug}`,
        injectIntoTemplate(template, buildCategoryPage({ catSlug, catLabel, citySlug, cityName })),
      );
      count++;
    }
  }

  console.log(`[prerender] wrote ${count} static HTML pages`);
}

main().catch((e) => {
  console.error('[prerender] failed:', e);
  // Don't break the build if prerendering fails — SPA still works
  process.exit(0);
});
