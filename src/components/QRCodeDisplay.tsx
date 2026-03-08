import { useEffect, useRef } from 'react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

/**
 * Simple QR code renderer using Canvas.
 * Generates a QR-like visual from the data string.
 * For a real QR we'd use a library, but this renders
 * the stored qr_data as text in a styled box.
 */
export default function QRCodeDisplay({ value, size = 200 }: QRCodeDisplayProps) {
  return (
    <div
      className="flex items-center justify-center font-mono text-xs break-all text-center p-3"
      style={{
        width: size,
        height: size,
        background: 'white',
        color: '#000',
        wordBreak: 'break-all',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div>
        <div className="text-4xl mb-2">📱</div>
        <div className="text-[10px] leading-tight">{value.length > 100 ? value.slice(0, 100) + '…' : value}</div>
      </div>
    </div>
  );
}
