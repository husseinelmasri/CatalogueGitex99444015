export default function SearchBar({ query, setQuery }) {
  return (
    <div className="bg-brand px-4 pb-3 pt-1 shadow-md">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for an item..."
        className="w-full rounded-lg px-4 py-3 text-base text-gray-900 outline-none focus:ring-2 focus:ring-accent"
      />
    </div>
  );
}
