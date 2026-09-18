import { useState } from 'react';
import {
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { formatPrice } from '../utils/formatPrice';
import { getPromo } from '../utils/promo';

const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG'];

export default function ItemCard({
  item,
  onClick,
  isAdmin,
  onChanged,
  onEditPrice,
}) {
  const [extIndex, setExtIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const imagePath = `/images/${item.name}.${EXTENSIONS[extIndex]}`;
  const promo = getPromo(item);
  const isOut = !!item.outOfStock;

  const handleError = (e) => {
    if (extIndex < EXTENSIONS.length - 1) {
      setExtIndex(extIndex + 1);
    } else {
      setFailed(true);
      e.target.src = '/images/placeholder.png';
    }
  };

  const toggleStock = async (e) => {
    e.stopPropagation();
    setBusy(true);
    try {
      if (isOut && item.outOfStock?.docId) {
        await deleteDoc(
          doc(db, 'catalogue_out_of_stock', item.outOfStock.docId),
        );
      } else {
        await setDoc(doc(db, 'catalogue_out_of_stock', item.id), {
          productId: item.id,
          note: null,
          createdAt: serverTimestamp(),
        });
      }
      await onChanged?.();
    } catch (err) {
      console.error(err);
      alert('Failed to update stock.');
    } finally {
      setBusy(false);
    }
  };

  const openDiscount = (e) => {
    e.stopPropagation();
    onEditPrice(item);
  };

  return (
    <div className="relative">
      <button
        onClick={() => onClick(item)}
        className="flex flex-col rounded-lg border bg-white p-2 shadow-sm hover:shadow-md transition text-left w-full">
        <div className="relative aspect-square w-full overflow-hidden rounded-md bg-white flex items-center justify-center">
          <img
            src={failed ? '/images/placeholder.png' : imagePath}
            alt={item.name}
            loading="lazy"
            className={`max-h-full max-w-full object-contain transition ${
              isOut ? 'opacity-30 grayscale' : ''
            }`}
            onError={handleError}
          />

          {promo && !isOut && (
            <span className="absolute top-2 left-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white shadow">
              -{promo.percent}%
            </span>
          )}

          {isOut && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="rotate-[-12deg] rounded-md bg-red-600 px-3 py-1.5 text-xs sm:text-sm font-extrabold tracking-wider text-white shadow-lg border-2 border-white">
                OUT OF STOCK
              </span>
            </div>
          )}
        </div>

        <h3
          className="mt-2 text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2"
          title={item.name}>
          {item.name}
        </h3>

        {isOut ? (
          <p className="mt-1 text-sm sm:text-base font-bold text-gray-400">
            Unavailable
          </p>
        ) : promo ? (
          <div className="mt-1 flex items-baseline gap-2 flex-wrap">
            <span className="text-sm sm:text-base font-bold text-red-600">
              {formatPrice(promo.discounted)}
            </span>
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(promo.original)}
            </span>
          </div>
        ) : (
          <p className="mt-1 text-sm sm:text-base font-bold text-brand">
            {formatPrice(item.price)}
          </p>
        )}
      </button>

      {isAdmin && (
        <div className="absolute bottom-2 right-2 z-20 flex flex-col gap-1 items-end">
          <button
            onClick={toggleStock}
            disabled={busy}
            className={`rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-bold shadow-lg transition ${
              busy
                ? 'bg-gray-400 text-white'
                : isOut
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
            }`}>
            {busy ? '...' : isOut ? 'Mark In' : 'Mark Out'}
          </button>
          <button
            onClick={openDiscount}
            className="rounded-full bg-brand px-2.5 py-1 text-[10px] sm:text-xs font-bold text-white shadow-lg hover:opacity-90">
            Discount
          </button>
        </div>
      )}
    </div>
  );
}
