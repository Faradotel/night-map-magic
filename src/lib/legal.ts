// Informations legales de l'editeur. A completer par le proprietaire du site.
// Tant que LEGAL_EDITOR_NAME est vide, la page
// /mentions-legales n'est pas liee et redirige vers /terms.

export const LEGAL_EDITOR_NAME = '';
/** Ex. : "Particulier", "Micro-entreprise, SIRET ...", "SAS au capital de ..." */
export const LEGAL_EDITOR_STATUS = '';
/** Optionnelle. */
export const LEGAL_EDITOR_ADDRESS = '';
export const LEGAL_CONTACT_EMAIL = 'contact@pulse-map.live';
export const HOST_NAME = '';
export const HOST_ADDRESS = '';

export const LEGAL_INFO_COMPLETE = LEGAL_EDITOR_NAME.trim() !== '';

/** Adresse de contact affichable, ou null si non renseignee. */
export const CONTACT_EMAIL: string | null = LEGAL_CONTACT_EMAIL.trim() || null;

/** Texte de repli quand l'adresse n'est pas renseignee (pas de mention "a completer"). */
export const CONTACT_FALLBACK_TEXT = 'via la page Contact du site';
