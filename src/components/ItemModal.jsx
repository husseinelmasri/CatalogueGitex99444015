import { useEffect, useRef, useState } from 'react';
import { formatPrice } from '../utils/formatPrice';

const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG'];
const BASE = import.meta.env.BASE_URL;
const ZOOM_LEVEL = 2.5;

export default function ItemModal({ item, onClose }) {
  const [extIndex, setExtIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  // Desktop hover zoom state
  const [hovering, setHovering] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  // Mobile touch zoom state
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  const imageBoxRef = useRef(null);
  const imageRef = useRef(null);

  // Gesture tracking refs
  const pointers = useRef(new Map()); // active pointers
  const lastPinch = useRef({ distance: 0, centerX: 0, centerY: 0 });
  const lastPan = useRef({ x: 0, y: 0 });
  const lastTapTime = useRef(0);

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

  // ===== DESKTOP HOVER ZOOM =====
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

  const handleMouseEnter = () => setHovering(true);
  const handleMouseLeave = () => {
    setHovering(false);
    setOrigin({ x: 50, y: 50 });
  };

  // ===== MOBILE TOUCH GESTURES =====
  const getDistance = (p1, p2) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getMidpoint = (p1, p2) => ({
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  });

  const handlePointerDown = (e) => {
    // Only handle touch
    if (e.pointerType !== 'touch') return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Detect double-tap
    const now = Date.now();
    if (now - lastTapTime.current < 300 && pointers.current.size === 1) {
      // Double tap → toggle zoom
      if (scale > 1) {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
      } else {
        setScale(ZOOM_LEVEL);
        const box = imageBoxRef.current;
        if (box) {
          const rect = box.getBoundingClientRect();
          const tapX = e.clientX - rect.left - rect.width / 2;
          const tapY = e.clientY - rect.top - rect.height / 2;
          // Move tapped point to center
          setTranslate({
            x: -tapX * (ZOOM_LEVEL - 1),
            y: -tapY * (ZOOM_LEVEL - 1),
          });
        }
      }
      lastTapTime.current = 0;
      return;
    }
    lastTapTime.current = now;

    // Setup for pinch or pan
    if (pointers.current.size === 2) {
      const [p1, p2] = Array.from(pointers.current.values());
      lastPinch.current = {
        distance: getDistance(p1, p2),
        centerX: getMidpoint(p1, p2).x,
        centerY: getMidpoint(p1, p2).y,
      };
    } else if (pointers.current.size === 1) {
      lastPan.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerMove = (e) => {
    if (e.pointerType !== 'touch') return;
    if (!pointers.current.has(e.pointerId)) return;

    // Update pointer position
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Two-finger pinch
    if (pointers.current.size === 2) {
      e.preventDefault();
      const [p1, p2] = Array.from(pointers.current.values());
      const distance = getDistance(p1, p2);
      const center = getMidpoint(p1, p2);

      if (lastPinch.current.distance > 0) {
        const ratio = distance / lastPinch.current.distance;
        const newScale = Math.max(1, Math.min(4, scale * ratio));
        setScale(newScale);

        // Adjust translation for pinch center movement
        const dx = center.x - lastPinch.current.centerX;
        const dy = center.y - lastPinch.current.centerY;
        setTranslate((prev) => ({
          x: prev.x + dx,
          y: prev.y + dy,
        }));
      }

      lastPinch.current = {
        distance,
        centerX: center.x,
        centerY: center.y,
      };
      return;
    }

    // One-finger pan (only when zoomed in)
    if (pointers.current.size === 1 && scale > 1) {
      e.preventDefault();
      const dx = e.clientX - lastPan.current.x;
      const dy = e.clientY - lastPan.current.y;
      setTranslate((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      lastPan.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e) => {
    if (e.pointerType !== 'touch') return;
    pointers.current.delete(e.pointerId);

    // Reset pan reference
    if (pointers.current.size === 1) {
      const [p] = Array.from(pointers.current.values());
      lastPan.current = { x: p.x, y: p.y };
    }

    // If pinching ended and scale is close to 1, snap back
    if (pointers.current.size < 2) {
      if (scale < 1.15) {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
      }
    }
  };

  // ===== EFFECTS =====

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

  // Compute the image transform
  const imageStyle = {
    transformOrigin: '50% 50%',
    transition: 'transform 0.15s ease-out',
    touchAction: 'none', // important for pinch
  };

  // On touch devices, use scale/translate. On mouse, use origin-based zoom.
  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;

  if (isTouch) {
    imageStyle.transform = `translate(${translate.x}px, ${translate.y}px) scale(${scale})`;
  } else {
    imageStyle.transform = hovering ? `scale(${ZOOM_LEVEL})` : 'scale(1)';
    imageStyle.transformOrigin = `${origin.x}% ${origin.y}%`;
    imageStyle.transition = hovering
      ? 'transform 0.08s ease-out'
      : 'transform 0.25s ease-out';
  }

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

        {/* Image area */}
        <div
          ref={imageBoxRef}
          className="relative aspect-square w-full bg-white p-4 flex items-center justify-center overflow-hidden cursor-zoom-in select-none"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}>
          <img
            ref={imageRef}
            src={failed ? placeholder : imagePath}
            alt={item.name}
            className="max-h-full max-w-full object-contain select-none"
            draggable={false}
            style={imageStyle}
            onError={handleError}
          />
        </div>

        {/* Info */}
        <div className="border-t p-4">
          <h2 className="text-lg font-semibold text-gray-900">{item.name}</h2>
          <p className="mt-2 text-2xl font-bold text-brand">
            {formatPrice(item.price)}
          </p>
          {isTouch && (
            <p className="mt-2 text-xs text-gray-400 text-center">
              Pinch to zoom
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
