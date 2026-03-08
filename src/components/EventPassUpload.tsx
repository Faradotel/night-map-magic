import { useState, useRef, useCallback, useEffect } from 'react';
import { QrCode, Camera, Upload, Check, Trash2, Loader2, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'sonner';
import { useEventPass } from '@/hooks/useEventPass';
import { useAuth } from '@/hooks/useAuth';

interface EventPassUploadProps {
  eventId: string;
  eventName: string;
}

export function EventPassUpload({ eventId, eventName }: EventPassUploadProps) {
  const { user } = useAuth();
  const { pass, loading, savePass, deletePass, hasPass } = useEventPass(eventId);
  const [mode, setMode] = useState<'idle' | 'camera' | 'saving'>('idle');
  const [decodedData, setDecodedData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const cameraContainerRef = useRef<HTMLDivElement>(null);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setMode('idle');
  }, []);

  const handleScanSuccess = useCallback(
    async (qrData: string, file?: File) => {
      setDecodedData(qrData);
      await stopCamera();
      setMode('saving');
      const result = await savePass({ eventName, qrData, imageFile: file });
      setMode('idle');
      if (result) {
        toast.success('Pass enregistré ! ✅');
      } else {
        toast.error("Erreur lors de l'enregistrement");
      }
    },
    [savePass, eventName, stopCamera],
  );

  const startCamera = useCallback(async () => {
    setMode('camera');
    // Wait for DOM to render the container
    await new Promise((r) => setTimeout(r, 100));
    
    const containerId = `qr-reader-${eventId}`;
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {}, // ignore scan failures
      );
    } catch (err) {
      toast.error("Impossible d'accéder à la caméra");
      setMode('idle');
    }
  }, [eventId, handleScanSuccess]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setMode('saving');
      
      // Create a temporary off-screen container for scanning
      const tempDiv = document.createElement('div');
      tempDiv.id = 'qr-file-scanner-temp';
      tempDiv.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;';
      document.body.appendChild(tempDiv);
      
      try {
        const scanner = new Html5Qrcode('qr-file-scanner-temp');
        const result = await scanner.scanFile(file, true);
        await scanner.clear();
        tempDiv.remove();
        await handleScanSuccess(result, file);
      } catch {
        // QR not found in image — still save the image as proof
        tempDiv.remove();
        const result = await savePass({ eventName, qrData: null, imageFile: file });
        setMode('idle');
        if (result) {
          toast.success('Image enregistrée (QR non détecté)');
        } else {
          toast.error("Erreur lors de l'enregistrement");
        }
      }
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [handleScanSuccess, savePass, eventName],
  );

  const handleDelete = useCallback(async () => {
    await deletePass();
    setDecodedData(null);
    toast.success('Pass supprimé');
  }, [deletePass]);

  if (!user) return null;
  if (loading) return null;

  // Already has a pass
  if (hasPass && pass) {
    return (
      <div
        className="rounded-xl p-3 border flex items-center gap-3"
        style={{ background: 'hsl(var(--primary) / 0.08)', borderColor: 'hsl(var(--primary) / 0.3)' }}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: 'hsl(var(--primary) / 0.15)' }}
        >
          <Check size={18} style={{ color: 'hsl(var(--primary))' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">Pass enregistré</p>
          <p className="text-xs text-muted-foreground truncate">
            {pass.qr_data ? `QR: ${pass.qr_data.slice(0, 40)}…` : 'Image uploadée'}
          </p>
        </div>
        <button
          onClick={handleDelete}
          className="w-8 h-8 rounded-lg flex items-center justify-center border transition-colors hover:bg-destructive/10"
          style={{ borderColor: 'hsl(var(--border))' }}
        >
          <Trash2 size={14} className="text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />
      {/* Hidden div for file scanning — must not use display:none or html5-qrcode fails */}
      <div id="qr-file-scanner" style={{ width: 0, height: 0, overflow: 'hidden', position: 'absolute' }} />

      {mode === 'camera' ? (
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-center justify-between px-3 py-2" style={{ background: 'hsl(var(--secondary))' }}>
            <span className="text-xs font-bold text-foreground">Scanner le QR code</span>
            <button onClick={stopCamera} className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </div>
          <div
            ref={cameraContainerRef}
            id={`qr-reader-${eventId}`}
            className="w-full"
            style={{ minHeight: 260 }}
          />
        </div>
      ) : mode === 'saving' ? (
        <div
          className="rounded-xl p-4 border flex items-center justify-center gap-2"
          style={{ background: 'var(--profile-card-bg)', borderColor: 'hsl(var(--border))' }}
        >
          <Loader2 size={16} className="animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Enregistrement…</span>
        </div>
      ) : (
        <div className="flex gap-2">
            <button
              onClick={startCamera}
              className="flex-1 h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all active:scale-95"
              style={{
                background: 'hsl(var(--primary) / 0.1)',
                borderColor: 'hsl(var(--primary) / 0.3)',
                color: 'hsl(var(--primary))',
              }}
            >
              <Camera size={15} />
              Scanner QR
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all active:scale-95"
              style={{
                background: 'hsl(var(--secondary))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
            >
              <Upload size={15} />
              Importer image
            </button>
          </div>
      )}
    </div>
  );
}
