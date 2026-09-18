import { useEffect, useState } from 'react';
import { formatPrice } from '../utils/formatPrice';

export default function PriceEditModal({ item, onCancel, onConfirm }) {
  const [value, setValue] = useState(String(item.price));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleConfirm = async () => {
    const num = Number(value);
    if (!value || isNaN(num) || num < 0) {
      setError('Enter a valid price');
      return;
    }
    if (num === item.price) {
      setError('Same as current price');
      return;
    }
    setBusy(true);
    try {
      await onConfirm(num);
    } catch (e) {
      setError('Failed to save');
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900 line-clamp-2">
            {item.name}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Current: {formatPrice(item.price)}
          </p>
        </div>

        <div className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New price (NLe)
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError('');
            }}
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-lg outline-none focus:ring-2 focus:ring-brand"
          />
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>

        <div className="flex gap-2 p-4 border-t">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-lg border border-gray-300 py-2 font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            className="flex-1 rounded-lg bg-brand py-2 font-medium text-white hover:opacity-90 disabled:opacity-50">
            {busy ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
