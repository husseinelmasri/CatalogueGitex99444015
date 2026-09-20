import { useEffect, useRef, useState } from 'react';
import { formatPrice } from '../utils/formatPrice';

const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG'];
const BASE = import.meta.env.BASE_URL;
const ZOOM_LEVEL = 2.5; // 2.5x magnification

export default function ItemModal({ item, onClose }) {
  const [extIndex, setExtIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const [zooming, setZooming] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 }); // percentages
  const imageBoxRef = useRef(null);

  const imagePath = `${BASE}images/${item.name}.${EXTENSIONS[extIndex]}`;
  const placeholder = `${BASE}images/placeholder.png`;

  const handleError = (e) => {
    if (extIndex < EXTENSIONS.length - 1) {
      setExtIndex(extIndex + 1);
    } else {
      setFailed(true);
      e.target.src = placeholder;
    }
  };

  const handleMouseMove = (e) => {
    const box = imageBoxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  const handleMouseEnter = () => setZooming(true);
  const handleMouseLeave = () => {
    setZooming(false);
    setOrigin({ x: 50, y: 50 });
  };

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent background scroll
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
          className="absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow hover:bg-white">
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

        {/* Magnifier image area */}
        <div
          ref={imageBoxRef}
          className="relative aspect-square w-full bg-white p-4 flex items-center justify-center overflow-hidden cursor-zoom-in"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}>
          <img
            src={failed ? placeholder : imagePath}
            alt={item.name}
            className="max-h-full max-w-full object-contain select-none"
            draggable={false}
            style={{
              transform: zooming ? `scale(${ZOOM_LEVEL})` : 'scale(1)',
              transformOrigin: `${origin.x}% ${origin.y}%`,
              transition: zooming
                ? 'transform 0.08s ease-out'
                : 'transform 0.25s ease-out',
            }}
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
