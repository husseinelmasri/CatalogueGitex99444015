import { useRef } from 'react';

// Emoji map for category names — matched by keyword
function getCategoryIcon(name) {
  const n = name.toLowerCase();
  if (n === 'all') return '🛍️';
  if (n.includes('detergent')) return '🧼';
  if (n.includes('stationery')) return '✏️';
  if (n.includes('food') || n.includes('essential')) return '🥫';
  if (n.includes('milk') || n.includes('dairy')) return '🥛';
  if (n.includes('batt')) return '🔋';
  if (n.includes('other')) return '📦';
  if (n.includes('spaghetti') || n.includes('pasta')) return '🍝';
  if (n.includes('pampers') || n.includes('diaper')) return '🍼';
  if (n.includes('sugar')) return '🍬';
  if (n.includes('chewing') || n.includes('gum')) return '🍬';
  if (n.includes('rice') || n.includes('grain')) return '🍚';
  if (n.includes('flour') || n.includes('baking')) return '🌾';
  if (n.includes('snack') || n.includes('confection')) return '🍫';
  if (n.includes('tooth') || n.includes('paste')) return '🪥';
  if (n.includes('cereal')) return '🥣';
  return '🏷️';
}

export default function CategoryFilter({ categories, active, setActive }) {
  const scrollRef = useRef(null);
  const allCategories = ['All', ...categories];

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const amount = 240;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="sticky top-[110px] z-30 bg-white border-b shadow-sm">
      <div className="relative max-w-7xl mx-auto">
        {/* Left arrow */}
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scroll('left')}
          className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-gray-700 hover:bg-gray-50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide scroll-smooth">
          {allCategories.map((cat) => {
            const isActive = active === cat;
            return (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                <span className="text-base leading-none">
                  {getCategoryIcon(cat)}
                </span>
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Right arrow */}
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scroll('right')}
          className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-gray-700 hover:bg-gray-50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
