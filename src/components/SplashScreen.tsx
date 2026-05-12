import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), 1700);
    const doneTimer = setTimeout(() => onComplete(), 2200);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden splash-root ${exiting ? 'splash-exit' : ''}`}
      style={{
        background:
          'radial-gradient(ellipse at 50% 40%, hsl(260 40% 14%) 0%, hsl(240 35% 7%) 45%, hsl(240 40% 4%) 100%)',
      }}
      aria-hidden={exiting}
    >
      {/* Ambient glow blobs */}
      <div
        className="absolute splash-ambient-1"
        style={{
          width: '70vmin',
          height: '70vmin',
          top: '20%',
          left: '15%',
          background: 'radial-gradient(circle, hsl(280 90% 60% / 0.35), transparent 65%)',
          filter: 'blur(40px)',
          borderRadius: '50%',
        }}
      />
      <div
        className="absolute splash-ambient-2"
        style={{
          width: '60vmin',
          height: '60vmin',
          bottom: '15%',
          right: '10%',
          background: 'radial-gradient(circle, hsl(200 95% 55% / 0.28), transparent 65%)',
          filter: 'blur(50px)',
          borderRadius: '50%',
        }}
      />

      {/* Logo + pulse rings */}
      <div className="relative flex flex-col items-center" style={{ marginTop: '-4vh' }}>
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Pulse rings */}
          <span className="absolute inset-0 rounded-full splash-ring splash-ring-1" />
          <span className="absolute inset-0 rounded-full splash-ring splash-ring-2" />
          <span className="absolute inset-0 rounded-full splash-ring splash-ring-3" />

          {/* Glow halo */}
          <span
            className="absolute splash-halo"
            style={{
              width: '180%',
              height: '180%',
              background:
                'radial-gradient(circle, hsl(280 100% 70% / 0.55), hsl(200 100% 60% / 0.15) 40%, transparent 70%)',
              filter: 'blur(20px)',
              borderRadius: '50%',
            }}
          />

          {/* Logo core */}
          <div className="relative splash-logo">
            <svg
              width="84"
              height="84"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                filter:
                  'drop-shadow(0 0 14px hsl(280 100% 70% / 0.85)) drop-shadow(0 0 30px hsl(200 100% 60% / 0.5))',
              }}
            >
              <defs>
                <linearGradient id="pulseGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="hsl(290 100% 75%)" />
                  <stop offset="100%" stopColor="hsl(195 100% 60%)" />
                </linearGradient>
              </defs>
              {/* Map pin shape with pulse waveform inside */}
              <path
                d="M50 8c-18 0-32 14-32 32 0 22 32 52 32 52s32-30 32-52c0-18-14-32-32-32z"
                stroke="url(#pulseGrad)"
                strokeWidth="4"
                fill="hsl(240 40% 6% / 0.4)"
              />
              <path
                d="M30 44 L38 44 L43 32 L52 56 L58 40 L64 48 L72 44"
                stroke="url(#pulseGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
        </div>

        {/* Wordmark */}
        <div className="splash-wordmark mt-6 text-center">
          <h1
            className="text-3xl font-bold tracking-[0.25em] uppercase"
            style={{
              background: 'linear-gradient(135deg, hsl(290 100% 80%), hsl(195 100% 70%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Pulse
          </h1>
        </div>

        {/* Tagline */}
        <p
          className="splash-tagline mt-3 text-xs tracking-[0.18em] uppercase font-light"
          style={{ color: 'hsl(240 20% 75% / 0.85)' }}
        >
          Discover what's happening now
        </p>
      </div>

      <style>{`
        .splash-root {
          opacity: 1;
          transition: opacity 0.5s ease, transform 0.6s ease;
        }
        .splash-exit {
          opacity: 0;
          transform: scale(1.04);
          pointer-events: none;
        }

        .splash-ambient-1 {
          animation: splash-drift-1 6s ease-in-out infinite alternate;
          opacity: 0;
          animation: splash-fade-in 0.8s ease-out forwards, splash-drift-1 6s ease-in-out 0.8s infinite alternate;
        }
        .splash-ambient-2 {
          opacity: 0;
          animation: splash-fade-in 0.9s ease-out 0.1s forwards, splash-drift-2 7s ease-in-out 0.9s infinite alternate;
        }
        @keyframes splash-fade-in { to { opacity: 1; } }
        @keyframes splash-drift-1 {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(20px, -15px) scale(1.08); }
        }
        @keyframes splash-drift-2 {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(-25px, 18px) scale(1.1); }
        }

        .splash-logo {
          opacity: 0;
          transform: scale(0.82);
          filter: blur(8px);
          animation: splash-logo-in 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.15s forwards,
                     splash-breath 2.4s ease-in-out 1s infinite;
        }
        @keyframes splash-logo-in {
          to { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        @keyframes splash-breath {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }

        .splash-halo {
          opacity: 0;
          animation: splash-halo-in 1s ease-out 0.3s forwards,
                     splash-halo-pulse 2.4s ease-in-out 1.3s infinite;
        }
        @keyframes splash-halo-in { to { opacity: 0.9; } }
        @keyframes splash-halo-pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }

        .splash-ring {
          border: 1.5px solid hsl(280 90% 70% / 0.6);
          opacity: 0;
          transform: scale(0.6);
        }
        .splash-ring-1 { animation: splash-ring 2s ease-out 0.7s infinite; }
        .splash-ring-2 { animation: splash-ring 2s ease-out 1.3s infinite; }
        .splash-ring-3 {
          border-color: hsl(195 95% 65% / 0.5);
          animation: splash-ring 2s ease-out 1.9s infinite;
        }
        @keyframes splash-ring {
          0% { opacity: 0; transform: scale(0.6); }
          25% { opacity: 0.8; }
          100% { opacity: 0; transform: scale(2.4); border-width: 0.5px; }
        }

        .splash-wordmark {
          opacity: 0;
          transform: translateY(8px);
          animation: splash-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.55s forwards;
        }
        .splash-tagline {
          opacity: 0;
          transform: translateY(6px);
          animation: splash-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.85s forwards;
        }
        @keyframes splash-rise {
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .splash-logo, .splash-halo, .splash-ring, .splash-wordmark,
          .splash-tagline, .splash-ambient-1, .splash-ambient-2 {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
          }
        }
      `}</style>
    </div>
  );
}
