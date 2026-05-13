import { ArrowLeft, QrCode, Image, Trash2, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useEventPass } from '@/hooks/useEventPass';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import QRCode from '@/components/QRCodeDisplay';

interface PassViewerScreenProps {
  eventId: string;
  eventName: string;
  onBack: () => void;
}

export function PassViewerScreen({ eventId, eventName, onBack }: PassViewerScreenProps) {
  const { pass, loading, deletePass, validatePass, hasPass } = useEventPass(eventId);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (pass?.image_path) {
      const { data } = supabase.storage.from('event-passes').getPublicUrl(pass.image_path);
      // For private buckets, use createSignedUrl instead
      supabase.storage
        .from('event-passes')
        .createSignedUrl(pass.image_path, 3600)
        .then(({ data }) => {
          if (data?.signedUrl) setImageUrl(data.signedUrl);
        });
    }
  }, [pass?.image_path]);

  const handleDelete = async () => {
    await deletePass();
    toast.success('Pass supprimé');
    onBack();
  };

  const handleValidate = async () => {
    if (validating) return;
    setValidating(true);
    const result = await validatePass();
    setValidating(false);
    if (!result) {
      toast.error('Impossible de valider le pass pour le moment');
      return;
    }
    switch (result.status) {
      case 'valid':
        toast.success('Pass validé ✓', { description: 'Bonne soirée !' });
        break;
      case 'already_used':
        toast.error('Ce pass a déjà été utilisé', {
          description: result.used_at
            ? `Utilisé le ${new Date(result.used_at).toLocaleString('fr-FR')}`
            : undefined,
        });
        break;
      case 'expired':
        toast.error('Ce pass est expiré', {
          description: result.valid_until
            ? `Expiré le ${new Date(result.valid_until).toLocaleString('fr-FR')}`
            : undefined,
        });
        break;
      case 'not_found':
        toast.error('Pass introuvable');
        break;
    }
  };

  return (
    <div
      className="absolute inset-0 z-[400] overflow-y-auto scrollbar-hidden"
      style={{ background: 'hsl(var(--surface-1))' }}
    >
      {/* Header */}
      <div className="px-4 pt-10 pb-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center border border-surface-4 text-muted-foreground"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium">Mon pass</p>
          <h1 className="text-lg font-black tracking-tight truncate">{eventName}</h1>
        </div>
      </div>

      <div className="px-4 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : !hasPass || !pass ? (
          <div className="text-center py-20">
            <QrCode size={48} className="mx-auto text-muted-foreground mb-4 opacity-30" />
            <p className="text-sm text-muted-foreground">Aucun pass enregistré pour cet événement</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* QR Code display */}
            {pass.qr_data && (
              <div
                className="rounded-2xl p-6 border flex flex-col items-center gap-4"
                style={{ background: 'var(--profile-card-bg)', borderColor: 'hsl(var(--border))' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <QrCode size={16} style={{ color: 'hsl(var(--primary))' }} />
                  <span className="text-sm font-bold">QR Code</span>
                </div>
                <div
                  className="bg-white rounded-xl p-4 flex items-center justify-center"
                  style={{ minWidth: 220, minHeight: 220 }}
                >
                  <QRCode value={pass.qr_data} size={200} />
                </div>
                <p className="text-xs text-muted-foreground text-center break-all max-w-[280px]">
                  {pass.qr_data}
                </p>
              </div>
            )}

            {/* Image display */}
            {pass.image_path && imageUrl && (
              <div
                className="rounded-2xl p-4 border flex flex-col items-center gap-3"
                style={{ background: 'var(--profile-card-bg)', borderColor: 'hsl(var(--border))' }}
              >
                <div className="flex items-center gap-2">
                  <Image size={16} style={{ color: 'hsl(var(--primary))' }} />
                  <span className="text-sm font-bold">Image du billet</span>
                </div>
                <img
                  src={imageUrl}
                  alt={`Billet d'entrée pour ${eventName}`}
                  className="rounded-xl max-w-full max-h-[400px] object-contain"
                />
              </div>
            )}

            {/* No QR, no image — just metadata */}
            {!pass.qr_data && !pass.image_path && (
              <div
                className="rounded-2xl p-6 border text-center"
                style={{ background: 'var(--profile-card-bg)', borderColor: 'hsl(var(--border))' }}
              >
                <p className="text-sm text-muted-foreground">Pass enregistré sans QR code ni image</p>
              </div>
            )}

            {/* Info + status */}
            <div
              className="rounded-xl p-3 border space-y-1"
              style={{ background: 'var(--profile-card-bg)', borderColor: 'hsl(var(--border))' }}
            >
              <p className="text-xs text-muted-foreground">
                Enregistré le {new Date(pass.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
              {pass.used_at && (
                <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'hsl(142, 71%, 45%)' }}>
                  <CheckCircle2 size={12} /> Utilisé le {new Date(pass.used_at).toLocaleString('fr-FR')}
                </p>
              )}
              {pass.valid_until && !pass.used_at && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Clock size={11} /> Valide jusqu'au {new Date(pass.valid_until).toLocaleString('fr-FR')}
                </p>
              )}
            </div>

            {/* Validate entry */}
            {!pass.used_at && (
              <button
                onClick={handleValidate}
                disabled={validating}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                style={{
                  background: 'hsl(142, 71%, 45%)',
                  color: 'white',
                  boxShadow: '0 4px 20px hsl(142, 71%, 45%, 0.4)',
                }}
              >
                {validating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                {validating ? 'Validation...' : 'Valider mon entrée'}
              </button>
            )}

            {/* Delete */}
            <button
              onClick={handleDelete}
              className="w-full py-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                borderColor: 'hsl(0 80% 55% / 0.3)',
                color: 'hsl(0 80% 55%)',
                background: 'hsl(0 80% 55% / 0.08)',
              }}
            >
              <Trash2 size={14} />
              Supprimer le pass
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
