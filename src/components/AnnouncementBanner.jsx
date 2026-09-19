import { useEffect, useState } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { formatPrice } from '../utils/formatPrice';

const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG'];
const BASE = import.meta.env.BASE_URL;
const AUTO_ROTATE_MS = 4000;

export default function AnnouncementBanner({
  drops,
  newProducts,
  isAdmin,
  onChanged,
}) {
  // Build tabs array
  const tabs = [];
  if (drops.length > 0)
    tabs.push({ key: 'drops', label: '⬇️Drops⬇️', items: drops });
  if (newProducts.length > 0)
    tabs.push({ key: 'new', label: '🚨New🚨', items: newProducts });

  // ---- ALL HOOKS FIRST ----
  const [activeTab, setActiveTab] = useState(tabs[0]?.key || 'drops');
  const [indexes, setIndexes] = useState({});
  const [extIndex, setExtIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [busy, setBusy] = useState(false);

  // Ensure activeTab stays valid
  useEffect(() => {
    if (tabs.length && !tabs.find((t) => t.key === activeTab)) {
      setActiveTab(tabs[0].key);
    }
  }, [tabs.map((t) => t.key).join(','), activeTab]);

  // Reset ext state when tab changes
  useEffect(() => {
    setExtIndex(0);
    setFailed(false);
  }, [activeTab]);

  const currentTab = tabs.find((t) => t.key === activeTab) || tabs[0];
  const items = currentTab?.items || [];
  const index = indexes[activeTab] || 0;
  const safeIndex = items.length > 0 ? Math.min(index, items.length - 1) : 0;

  // Auto-rotate active tab
  useEffect(() => {
    if (items.length <= 1 || paused) return;
    const t = setInterval(() => {
      setIndexes((prev) => ({
        ...prev,
        [activeTab]: ((prev[activeTab] || 0) + 1) % items.length,
      }));
      setExtIndex(0);
      setFailed(false);
    }, AUTO_ROTATE_MS);
    return () => clearInterval(t);
  }, [activeTab, items.length, paused]);

  // ---- NOW early returns are safe ----
  if (!currentTab || items.length === 0) return null;

  const change = items[safeIndex];
  const imagePath = `${BASE}images/${change.name}.${EXTENSIONS[extIndex]}`;
  const placeholder = `${BASE}images/placeholder.png`;

  const handleError = (e) => {
    if (extIndex < EXTENSIONS.length - 1) {
      setExtIndex(extIndex + 1);
    } else {
      setFailed(true);
      e.target.src = placeholder;
    }
  };

  const goTo = (i) => {
    setIndexes((prev) => ({ ...prev, [activeTab]: i }));
    setExtIndex(0);
    setFailed(false);
  };

  const handleDismiss = async () => {
    if (!change.docId) return;
    const label =
      activeTab === 'drops'
        ? 'Remove this price announcement for all visitors?'
        : 'Remove this from the New list?';
    if (!window.confirm(label)) return;
    setBusy(true);
    try {
      const coll =
        activeTab === 'drops'
          ? 'catalogue_price_announcements'
          : 'catalogue_new_products';
      await deleteDoc(doc(db, coll, change.docId));
      await onChanged?.();
    } catch (err) {
      console.error(err);
      alert('Failed to remove.');
    } finally {
      setBusy(false);
    }
  };

  const isDrop = activeTab === 'drops';
  const isDecrease = isDrop && change.newPrice < change.oldPrice;
  const total = items.length;
  const showTabs = tabs.length > 1;

  return (
    <div className="anim-slide-down sticky top-[110px] z-30 px-3 pt-3">
      <div
        className="anim-pulse-glow mx-auto max-w-3xl rounded-xl border-2 border-red-500 bg-white shadow-lg overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}>
        {showTabs && (
          <div className="flex border-b bg-gray-50">
            {tabs.map((t) => {
              const active = t.key === activeTab;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex-1 px-4 py-2 text-xs sm:text-sm font-bold transition ${
                    active
                      ? 'bg-white text-red-600 border-b-2 border-red-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {t.label}
                  <span className="ml-1 text-gray-400">({t.items.length})</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-3 p-3 sm:p-4">
          <div
            key={change.docId + 'img'}
            className="anim-image-pop flex h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50 overflow-hidden">
            <img
              src={failed ? placeholder : imagePath}
              alt={change.name}
              className="max-h-full max-w-full object-contain"
              onError={handleError}
            />
          </div>

          <div
            key={change.docId + 'info'}
            className="anim-slide-down flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-block h-2 w-2 rounded-full animate-pulse ${
                  isDrop ? 'bg-red-500' : 'bg-blue-500'
                }`}
              />
              <span
                className={`text-xs sm:text-sm font-extrabold tracking-wider uppercase ${
                  isDrop ? 'text-red-600' : 'text-blue-600'
                }`}>
                {isDrop
                  ? isDecrease
                    ? 'Price Drop'
                    : 'Price Update'
                  : 'New Product'}
              </span>
            </div>
            <p className="text-sm sm:text-base font-bold text-gray-900 truncate mt-0.5">
              {change.name}
            </p>
            <div className="mt-1 flex items-baseline gap-2 flex-wrap">
              {isDrop ? (
                <>
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
                </>
              ) : (
                <span className="anim-price-flash rounded px-1 text-lg sm:text-xl font-extrabold text-blue-600">
                  {formatPrice(change.price)}
                </span>
              )}
            </div>
          </div>

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

        {total > 1 && (
          <div className="flex items-center justify-center gap-1.5 pb-2">
            {items.map((_, i) => (
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
