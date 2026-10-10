// Tag d'affiliation impact.com, charge UNIQUEMENT apres consentement explicite.
// Sans consentement (refus ou absence de choix), aucun script n'est charge et les
// liens restent des liens directs.
//
// transformLinks est volontairement desactive : le tag ne documente pas de moyen
// fiable d'exclure certains domaines, et aucun mecanisme de revenu ne doit
// s'appliquer aux liens Ticketmaster (conditions de leur API). Seul le suivi
// d'impression est actif.

const IMPACT_SRC = 'https://utt.impactcdn.com/P-A7261544-5f75-4391-bf8c-e18beac7e5f01.js';
let loaded = false;

type ImpactFn = ((...args: unknown[]) => void) & { a?: unknown[][] };

export function isImpactLoaded(): boolean {
  return loaded;
}

export function loadImpactTag(): void {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  const w = window as unknown as Record<string, unknown>;
  w.ire_o = 'impactStat';
  if (!w.impactStat) {
    const fn: ImpactFn = (...args: unknown[]) => {
      (fn.a = fn.a || []).push(args);
    };
    w.impactStat = fn;
  }
  const script = document.createElement('script');
  script.async = true;
  script.src = IMPACT_SRC;
  script.onload = () => {
    try {
      (w.impactStat as ImpactFn)('trackImpression');
    } catch {
      /* jamais bloquant */
    }
  };
  document.head.appendChild(script);
}
