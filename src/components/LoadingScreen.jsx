import { useEffect, useState } from 'react';

const WORDS = [
  { text: 'QUALITY', color: 'white' },
  { text: 'YOU', color: 'white' },
  { text: 'TRUST.', color: 'gold' },
  { text: 'PRICES', color: 'white' },
  { text: 'YOU', color: 'white' },
  { text: 'LOVE.', color: 'gold' },
];

export default function LoadingScreen() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible >= WORDS.length) return;
    const t = setTimeout(() => setVisible((v) => v + 1), 300);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand px-6 text-white relative overflow-hidden">
      {/* Soft radial glow behind text */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at center, rgba(255,255,255,0.08), transparent 65%)',
        }}
      />

      {/* Tagline */}
      <div className="relative flex flex-wrap justify-center gap-x-3 gap-y-2 max-w-lg text-center">
        {WORDS.map((word, i) => (
          <span
            key={i}
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight"
            style={{
              color: word.color === 'gold' ? '#FFD700' : '#FFFFFF',
              opacity: i < visible ? 1 : 0,
              transform:
                i < visible
                  ? 'scale(1) translateY(0)'
                  : 'scale(0.5) translateY(10px)',
              transition:
                'opacity 0.4s ease-out, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              display: 'inline-block',
              textShadow:
                word.color === 'gold'
                  ? '0 0 20px rgba(255,215,0,0.4)'
                  : '0 0 20px rgba(255,255,255,0.15)',
            }}>
            {word.text}
          </span>
        ))}
      </div>

      {/* Bouncing dots */}
      <div className="mt-12 flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-3 h-3 rounded-full bg-white/80 inline-block"
            style={{
              animation: 'bounceDot 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>

      {/* Shop name beneath */}
      <p
        className="mt-6 text-sm text-white/60 tracking-[0.3em] font-medium"
        style={{
          animation: 'fadeIn 1s ease-out 1.2s both',
        }}>
        GITEX CO LTD
      </p>

      <style>{`
        @keyframes bounceDot {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          40% {
            transform: translateY(-12px);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
