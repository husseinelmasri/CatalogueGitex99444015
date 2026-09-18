export default function CategoryFilter({ categories, active, setActive }) {
  const allCategories = ['All', ...categories];

  return (
    <div className="bg-white border-b overflow-x-auto">
      <div className="flex gap-2 px-4 py-3 max-w-2xl mx-auto">
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
