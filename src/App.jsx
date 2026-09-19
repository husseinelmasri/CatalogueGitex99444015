import { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import SearchBar from './components/SearchBar';
import CategoryFilter from './components/CategoryFilter';
import ItemCard from './components/ItemCard';
import ItemModal from './components/ItemModal';
import PriceEditModal from './components/PriceEditModal';
import AnnouncementBanner from './components/AnnouncementBanner';
import LoadingScreen from './components/LoadingScreen';
import { useAdmin } from './hooks/useAdmin';
import { useTapCounter } from './hooks/useTapCounter';

// ===== Emoji icons for categories =====
function getCategoryIcon(name) {
  const n = (name || '').toLowerCase();
  if (n === 'all') return '🛍️';
  if (n.includes('detergent')) return '🧼';
  if (n.includes('stationery')) return '✏️';
  if (n.includes('food') || n.includes('essential')) return '🥫';
  if (n.includes('milk')) return '🐄';
  if (n.includes('dairy')) return '🥛';
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
  if (n.includes('drink') || n.includes('beverage')) return '🥤';
  return '🏷️';
}

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minTimeDone, setMinTimeDone] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [announcements, setAnnouncements] = useState({
    drops: [],
    newProducts: [],
  });

  const { isAdmin, activateAdmin, deactivateAdmin } = useAdmin();
  const tapLogo = useTapCounter(activateAdmin, 10, 2000);

  // Minimum splash duration so the loading animation always completes
  useEffect(() => {
    const t = setTimeout(() => setMinTimeDone(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const loadData = async () => {
    try {
      const productSnap = await getDocs(collection(db, 'catalogue_products'));

      let promos = [];
      try {
        const promoSnap = await getDocs(collection(db, 'catalogue_promotions'));
        promos = promoSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch {}

      let outOfStock = {};
      try {
        const oosSnap = await getDocs(collection(db, 'catalogue_out_of_stock'));
        oosSnap.docs.forEach((d) => {
          const data = d.data();
          if (data.productId) {
            outOfStock[data.productId] = {
              docId: d.id,
              note: data.note || null,
            };
          }
        });
      } catch {}

      let newProducts = {};
      let newList = [];
      try {
        const newSnap = await getDocs(collection(db, 'catalogue_new_products'));
        newSnap.docs.forEach((d) => {
          const data = d.data();
          if (data.productId) {
            newProducts[data.productId] = { docId: d.id };
            newList.push({
              docId: d.id,
              productId: data.productId,
              name: data.name,
              price: data.price,
              at: data.createdAt?.toDate?.() ?? new Date(0),
            });
          }
        });
        newList.sort((a, b) => b.at - a.at);
      } catch {}

      let anns = [];
      try {
        const annSnap = await getDocs(
          collection(db, 'catalogue_price_announcements'),
        );
        anns = annSnap.docs
          .map((d) => {
            const data = d.data();
            return {
              docId: d.id,
              productId: data.productId,
              name: data.name,
              oldPrice: data.oldPrice,
              newPrice: data.newPrice,
              at: data.createdAt?.toDate?.() ?? new Date(0),
            };
          })
          .sort((a, b) => b.at - a.at);
      } catch {}

      const now = new Date();
      const promoMap = {};
      promos.forEach((p) => {
        if (p.active === false) return;
        if (p.startDate?.toDate && now < p.startDate.toDate()) return;
        if (p.endDate?.toDate && now > p.endDate.toDate()) return;
        promoMap[p.productId] = {
          discount: p.discount,
          endDate: p.endDate?.toDate?.() ?? null,
        };
      });

      const data = productSnap.docs
        .map((d) => {
          const p = d.data();
          return {
            id: d.id,
            name: p.name,
            price: p.price,
            category: p.category || 'Other',
            archived: p.archived,
            promo: promoMap[d.id] || null,
            outOfStock: outOfStock[d.id] || null,
            isNew: !!newProducts[d.id],
            newDocId: newProducts[d.id]?.docId || null,
          };
        })
        .filter((item) => item.name && !item.archived);

      setItems(data);
      setAnnouncements({
        drops: anns,
        newProducts: newList,
      });
    } catch (err) {
      console.error('Firebase error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: ['name'],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [items],
  );

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return Array.from(set).sort();
  }, [items]);

  const results = useMemo(() => {
    let list = query.trim() ? fuse.search(query).map((r) => r.item) : items;
    if (activeCategory !== 'All') {
      list = list.filter((i) => i.category === activeCategory);
    }
    return list;
  }, [query, activeCategory, fuse, items]);

  // Group results by category → then by brand (first word of name)
  const groupedResults = useMemo(() => {
    const categoryGroups = {};
    results.forEach((item) => {
      const cat = item.category || 'Other';
      if (!categoryGroups[cat]) categoryGroups[cat] = [];
      categoryGroups[cat].push(item);
    });

    return Object.keys(categoryGroups)
      .sort((a, b) => a.localeCompare(b))
      .map((cat) => {
        // Group by first word of product name (uppercased)
        const brandGroups = {};
        categoryGroups[cat].forEach((item) => {
          const name = (item.name || '').trim();
          const firstWord = name.split(/\s+/)[0] || 'Other';
          const brandKey = firstWord.toUpperCase();
          if (!brandGroups[brandKey]) brandGroups[brandKey] = [];
          brandGroups[brandKey].push(item);
        });

        const brands = Object.keys(brandGroups)
          .sort((a, b) => a.localeCompare(b))
          .map((brand) => ({
            brand,
            items: brandGroups[brand].sort((a, b) =>
              (a.name || '').localeCompare(b.name || ''),
            ),
          }));

        return {
          category: cat,
          totalItems: categoryGroups[cat].length,
          brands,
        };
      });
  }, [results]);

  const confirmPriceChange = async (newPrice) => {
    if (!editing) return;
    const oldPrice = editing.price;

    await updateDoc(doc(db, 'catalogue_products', editing.id), {
      price: Number(newPrice),
    });

    try {
      await addDoc(collection(db, 'catalogue_price_announcements'), {
        productId: editing.id,
        name: editing.name,
        oldPrice: Number(oldPrice),
        newPrice: Number(newPrice),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to create announcement:', err);
    }

    setEditing(null);
    await loadData();
  };

  // Show splash until BOTH data loaded AND minimum time passed
  if (loading || !minTimeDone) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 p-4 text-center">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header + search bar */}
      <div className="sticky top-0 z-40 shadow-md">
        <header className="bg-brand px-4 pt-5 pb-2 text-center text-white">
          <h1
            onClick={tapLogo}
            className="text-xl font-bold select-none cursor-default">
            Gitex Co LTD
          </h1>
          {isAdmin && (
            <div className="mt-2 flex items-center justify-center gap-2 text-xs">
              <span className="bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded font-semibold">
                ADMIN MODE
              </span>
              <button
                onClick={deactivateAdmin}
                className="underline text-white/80 hover:text-white">
                exit
              </button>
            </div>
          )}
        </header>

        <SearchBar query={query} setQuery={setQuery} />
      </div>

      <CategoryFilter
        categories={categories}
        active={activeCategory}
        setActive={setActiveCategory}
      />

      <AnnouncementBanner
        drops={announcements.drops}
        newProducts={announcements.newProducts}
        isAdmin={isAdmin}
        onChanged={loadData}
      />

      <main className="p-4 mx-auto max-w-7xl">
        {results.length === 0 ? (
          <p className="text-center text-gray-500 py-10">No items found</p>
        ) : (
          <div className="space-y-10">
            {groupedResults.map((group) => (
              <section key={group.category}>
                {/* Category header — centered with separator on both sides */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-gray-300" />
                  <h2 className="text-lg sm:text-xl font-bold text-brand whitespace-nowrap text-center">
                    {getCategoryIcon(group.category)} {group.category}
                  </h2>
                  <span className="text-xs sm:text-sm text-gray-400 font-medium whitespace-nowrap">
                    ({group.totalItems})
                  </span>
                  <div className="flex-1 h-px bg-gray-300" />
                </div>

                {/* Brand subgroups */}
                <div className="space-y-6">
                  {group.brands.map((brandGroup) => (
                    <div key={brandGroup.brand}>
                      {/* Brand subheader */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-5 bg-brand rounded-full" />
                        <h3 className="text-sm sm:text-base font-bold text-gray-700 uppercase tracking-wide">
                          {brandGroup.brand}
                        </h3>
                        <span className="text-xs text-gray-400 font-medium">
                          ({brandGroup.items.length})
                        </span>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>

                      {/* Grid of items in this brand */}
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {brandGroup.items.map((item) => (
                          <ItemCard
                            key={item.id}
                            item={item}
                            onClick={setSelected}
                            isAdmin={isAdmin}
                            onChanged={loadData}
                            onEditPrice={setEditing}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <footer className="p-4 text-center text-xs text-gray-400">
        {results.length} item{results.length !== 1 ? 's' : ''} •{' '}
        {groupedResults.length} categor
        {groupedResults.length !== 1 ? 'ies' : 'y'}
      </footer>

      {selected && (
        <ItemModal item={selected} onClose={() => setSelected(null)} />
      )}

      {editing && (
        <PriceEditModal
          item={editing}
          onCancel={() => setEditing(null)}
          onConfirm={confirmPriceChange}
        />
      )}
    </div>
  );
}
