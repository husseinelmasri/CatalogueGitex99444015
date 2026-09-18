import { useEffect, useState } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { formatPrice } from '../utils/formatPrice';

const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG'];
const AUTO_ROTATE_MS = 4000;

export default function PriceChangeBanner({ changes, isAdmin, onChanged }) {
  const [index, setIndex] = useState(0);
  const [extIndex, setExtIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setIndex(0);
    setExtIndex(0);
    setFailed(false);
  }, [changes.length]);

  useEffect(() => {
    if (changes.length <= 1 || paused) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % changes.length);
      setExtIndex(0);
      setFailed(false);
    }, AUTO_ROTATE_MS);
    return () => clearInterval(t);
  }, [changes.length, paused]);

  if (!changes.length) return null;

  const safeIndex = Math.min(index, changes.length - 1);
  const change = changes[safeIndex];
  const imagePath = `/images/${change.name}.${EXTENSIONS[extIndex]}`;

  const handleError = (e) => {
    if (extIndex < EXTENSIONS.length - 1) {
      setExtIndex(extIndex + 1);
    } else {
      setFailed(true);
      e.target.src = '/images/placeholder.png';
    }
  };

  const goTo = (i) => {
    setIndex(i);
    setExtIndex(0);
    setFailed(false);
  };

  const handleDismiss = async () => {
    if (!change.docId) return;
    if (!window.confirm('Remove this announcement for all visitors?')) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, 'catalogue_price_announcements', change.docId));
      await onChanged?.();
    } catch (err) {
      console.error(err);
      alert('Failed to remove announcement.');
    } finally {
      setBusy(false);
    }
  };

  const isDecrease = change.newPrice < change.oldPrice;
  const total = changes.length;

  return (
    <div className="anim-slide-down sticky top-[110px] z-30 px-3 pt-3">
      <div
        className="anim-pulse-glow mx-auto max-w-3xl rounded-xl border-2 border-red-500 bg-white shadow-lg overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}>
        <div className="flex items-center gap-3 p-3 sm:p-4">
          {/* Image */}
          <div
            key={change.docId + 'img'}
            className="anim-image-pop flex h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50 overflow-hidden">
            <img
              src={failed ? '/images/placeholder.png' : imagePath}
              alt={change.name}
              className="max-h-full max-w-full object-contain"
              onError={handleError}
            />
          </div>

          {/* Info */}
          <div
            key={change.docId + 'info'}
            className="anim-slide-down flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs sm:text-sm font-extrabold tracking-wider text-red-600 uppercase">
                {isDecrease ? 'Price Drop' : 'Price Update'}
              </span>
            </div>
            <p className="text-sm sm:text-base font-bold text-gray-900 truncate mt-0.5">
              {change.name}
            </p>
            <div className="mt-1 flex items-baseline gap-2 flex-wrap">
              <span className="text-xs sm:text-sm text-gray-400 line-through">
                {formatPrice(change.oldPrice)}
              </span>
              <span className="anim-arrow-slide text-base sm:text-lg text-gray-500 font-bold">
                →
              </span>
              <span
                className={`anim-price-flash rounded px-1 text-lg sm:text-xl font-extrabold ${
                  isDecrease ? 'text-green-600' : 'text-red-600'
                }`}>
                {formatPrice(change.newPrice)}
              </span>
            </div>
          </div>

          {/* Admin X */}
          {isAdmin && (
            <button
              onClick={handleDismiss}
              disabled={busy}
              aria-label="Remove for all visitors"
              className="flex h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 items-center justify-center rounded-full bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 sm:h-5 sm:w-5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Carousel dots */}
        {total > 1 && (
          <div className="flex items-center justify-center gap-1.5 pb-2">
            {changes.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to item ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === safeIndex
                    ? 'w-6 bg-red-500'
                    : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
