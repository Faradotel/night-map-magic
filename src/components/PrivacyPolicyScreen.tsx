import { useState } from 'react';
import { ArrowLeft, Shield, Database, Eye, Trash2, Mail, MapPin, Users } from 'lucide-react';

interface PrivacyPolicyScreenProps {
  onBack: () => void;
}

export function PrivacyPolicyScreen({ onBack }: PrivacyPolicyScreenProps) {
  return (
    <div className="absolute inset-0 z-[600] overflow-y-auto scrollbar-hidden" style={{ background: 'hsl(var(--background))' }}>
      <div className="px-4 pt-10 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-90"
            style={{ background: 'var(--controls-bg)', borderColor: 'hsl(var(--border))' }}
          >
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight">Confidentialité</h1>
            <p className="text-xs text-muted-foreground">Politique de protection des données</p>
          </div>
        </div>

        {/* Intro */}
        <div className="rounded-2xl p-4 border mb-4" style={{ background: 'var(--profile-card-bg)', borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--accent) / 0.12)' }}>
              <Shield size={20} style={{ color: 'hsl(var(--accent))' }} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">PulseMap – RGPD</p>
              <p className="text-[10px] text-muted-foreground">Dernière mise à jour : février 2026</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            NightMap s'engage à protéger la vie privée de ses utilisateurs conformément au Règlement Général sur la Protection des Données (RGPD – UE 2016/679) et à la loi Informatique et Libertés.
          </p>
        </div>

        {/* Section: Données collectées */}
        <Section
          icon={<Database size={16} style={{ color: 'hsl(183 100% 50%)' }} />}
          iconBg="hsl(183 100% 50% / 0.12)"
          title="1. Données collectées"
        >
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
            Nous collectons uniquement les données nécessaires au fonctionnement de l'application :
          </p>
          <ul className="space-y-1.5">
            <DataItem label="Email & mot de passe" desc="Pour la création et la sécurisation de ton compte." />
            <DataItem label="Pseudo" desc="Affiché publiquement pour identifier ton profil auprès de tes amis." />
            <DataItem label="Ville préférée" desc="Pour afficher les événements pertinents dans ta zone." />
            <DataItem label="Historique de présence" desc="Les événements auxquels tu as indiqué participer (check-ins)." />
            <DataItem label="Liste d'amis" desc="Les connexions avec d'autres utilisateurs que tu as acceptées." />
          </ul>
        </Section>

        {/* Section: Géolocalisation */}
        <Section
          icon={<MapPin size={16} style={{ color: 'hsl(315 100% 53%)' }} />}
          iconBg="hsl(315 100% 53% / 0.12)"
          title="2. Géolocalisation"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            NightMap peut utiliser ta position géographique pour afficher les événements proches de toi. Cette donnée est traitée <strong className="text-foreground">localement dans ton navigateur</strong> et n'est jamais transmise ni stockée sur nos serveurs. Tu peux refuser la géolocalisation à tout moment via les paramètres de ton navigateur, et utiliser le mode « Ville » à la place.
          </p>
        </Section>

        {/* Section: Finalités */}
        <Section
          icon={<Eye size={16} style={{ color: 'hsl(275 71% 58%)' }} />}
          iconBg="hsl(275 71% 58% / 0.12)"
          title="3. Finalités du traitement"
        >
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
            Tes données sont utilisées exclusivement pour :
          </p>
          <ul className="space-y-1">
            <li className="text-xs text-muted-foreground">• Créer et gérer ton compte utilisateur</li>
            <li className="text-xs text-muted-foreground">• Afficher les événements pertinents selon ta localisation ou ta ville</li>
            <li className="text-xs text-muted-foreground">• Permettre le suivi de tes participations (check-ins) et badges</li>
            <li className="text-xs text-muted-foreground">• Gérer ta liste d'amis et les notifications associées</li>
            <li className="text-xs text-muted-foreground">• Améliorer l'expérience utilisateur de l'application</li>
          </ul>
          <p className="text-xs text-muted-foreground leading-relaxed mt-2">
            <strong className="text-foreground">Aucune donnée n'est vendue, louée ou transmise à des tiers à des fins commerciales.</strong>
          </p>
        </Section>

        {/* Section: Partage */}
        <Section
          icon={<Users size={16} style={{ color: 'hsl(45 100% 55%)' }} />}
          iconBg="hsl(45 100% 55% / 0.12)"
          title="4. Partage des données"
        >
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
            Tes données sont visibles de manière limitée :
          </p>
          <ul className="space-y-1">
            <li className="text-xs text-muted-foreground">• <strong className="text-foreground">Pseudo :</strong> visible par tous les utilisateurs (pour la recherche d'amis)</li>
            <li className="text-xs text-muted-foreground">• <strong className="text-foreground">Check-ins :</strong> visibles uniquement par toi et tes amis confirmés</li>
            <li className="text-xs text-muted-foreground">• <strong className="text-foreground">Email :</strong> jamais affiché publiquement</li>
          </ul>
          <p className="text-xs text-muted-foreground leading-relaxed mt-2">
            Les données d'événements proviennent de sources tierces (Shotgun, Ticketmaster) et sont affichées en l'état.
          </p>
        </Section>

        {/* Section: Conservation */}
        <Section
          icon={<Database size={16} style={{ color: 'hsl(130 60% 55%)' }} />}
          iconBg="hsl(130 60% 55% / 0.12)"
          title="5. Conservation des données"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tes données sont conservées tant que ton compte est actif. En cas de suppression de compte, toutes tes données personnelles (profil, check-ins, amitiés, notifications) sont supprimées définitivement dans un délai de 30 jours.
          </p>
        </Section>

        {/* Section: Hébergement */}
        <Section
          icon={<Shield size={16} style={{ color: 'hsl(210 100% 56%)' }} />}
          iconBg="hsl(210 100% 56% / 0.12)"
          title="6. Hébergement & sécurité"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            Les données sont hébergées sur des serveurs sécurisés au sein de l'Union Européenne. Les communications sont chiffrées via HTTPS/TLS. Les mots de passe sont hashés et ne sont jamais stockés en clair. L'accès aux données est protégé par des politiques de sécurité au niveau de la base de données (Row Level Security).
          </p>
        </Section>

        {/* Section: Droits */}
        <Section
          icon={<Trash2 size={16} style={{ color: 'hsl(0 84% 60%)' }} />}
          iconBg="hsl(0 84% 60% / 0.12)"
          title="7. Tes droits (RGPD)"
        >
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
            Conformément au RGPD, tu disposes des droits suivants :
          </p>
          <ul className="space-y-1">
            <li className="text-xs text-muted-foreground">• <strong className="text-foreground">Droit d'accès :</strong> consulter tes données personnelles</li>
            <li className="text-xs text-muted-foreground">• <strong className="text-foreground">Droit de rectification :</strong> modifier tes informations (pseudo, ville…)</li>
            <li className="text-xs text-muted-foreground">• <strong className="text-foreground">Droit à l'effacement :</strong> supprimer ton compte et toutes tes données</li>
            <li className="text-xs text-muted-foreground">• <strong className="text-foreground">Droit à la portabilité :</strong> exporter tes données dans un format lisible</li>
            <li className="text-xs text-muted-foreground">• <strong className="text-foreground">Droit d'opposition :</strong> t'opposer à certains traitements</li>
            <li className="text-xs text-muted-foreground">• <strong className="text-foreground">Droit de retrait :</strong> retirer ton consentement à tout moment</li>
          </ul>
        </Section>

        {/* Section: Contact */}
        <Section
          icon={<Mail size={16} style={{ color: 'hsl(var(--accent))' }} />}
          iconBg="hsl(var(--accent) / 0.12)"
          title="8. Contact"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pour exercer tes droits ou pour toute question relative à la protection de tes données, tu peux nous contacter à :
          </p>
          <p className="text-sm font-bold mt-2" style={{ color: 'hsl(var(--accent))' }}>
            privacy@nightmap.app
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Tu peux également adresser une réclamation à la CNIL (Commission Nationale de l'Informatique et des Libertés) : <span className="font-medium text-foreground">www.cnil.fr</span>
          </p>
        </Section>

        {/* Section: Cookies */}
        <Section
          icon={<Shield size={16} style={{ color: 'hsl(25 90% 55%)' }} />}
          iconBg="hsl(25 90% 55% / 0.12)"
          title="9. Cookies & stockage local"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            NightMap utilise le stockage local du navigateur (localStorage) pour sauvegarder tes préférences (thème, unité de distance, ville préférée) et ta session d'authentification. Aucun cookie tiers de tracking ou publicitaire n'est utilisé.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ icon, iconBg, title, children }: { icon: React.ReactNode; iconBg: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4 border mb-3" style={{ background: 'var(--profile-card-bg)', borderColor: 'hsl(var(--border))' }}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
          {icon}
        </div>
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function DataItem({ label, desc }: { label: string; desc: string }) {
  return (
    <li className="text-xs text-muted-foreground flex gap-1.5">
      <span className="text-foreground">•</span>
      <span><strong className="text-foreground">{label} :</strong> {desc}</span>
    </li>
  );
}
