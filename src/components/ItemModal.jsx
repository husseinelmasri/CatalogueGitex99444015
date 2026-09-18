import { useEffect, useState } from 'react';
import { formatPrice } from '../utils/formatPrice';

const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG'];

export default function ItemModal({ item, onClose }) {
  const [extIndex, setExtIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  const imagePath = `/images/${item.name}.${EXTENSIONS[extIndex]}`;

  const handleError = (e) => {
    if (extIndex < EXTENSIONS.length - 1) {
      setExtIndex(extIndex + 1);
    } else {
      setFailed(true);
      e.target.src = '/images/placeholder.png';
    }
  };

  // Close modal on Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent background scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow hover:bg-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Image */}
        <div className="flex aspect-square w-full items-center justify-center bg-white p-4">
          <img
            src={failed ? '/images/placeholder.png' : imagePath}
            alt={item.name}
            className="max-h-full max-w-full object-contain"
            onError={handleError}
          />
        </div>

        {/* Info */}
        <div className="border-t p-4">
          <h2 className="text-lg font-semibold text-gray-900">{item.name}</h2>
          <p className="mt-2 text-2xl font-bold text-brand">
            {formatPrice(item.price)}
          </p>
        </div>
      </div>
    </div>
  );
}
