export default function CategoryFilter({ categories, active, setActive }) {
  const allCategories = ['All', ...categories];

  return (
    <div className="sticky top-[110px] z-30 bg-white border-b shadow-sm">
      <div className="flex gap-2 px-4 py-3 overflow-x-auto max-w-7xl mx-auto scrollbar-hide">
        {allCategories.map((cat) => {
          const isActive = active === cat;
          return (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}>
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
