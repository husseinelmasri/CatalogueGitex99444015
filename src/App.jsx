import { useState, useEffect, useMemo, useRef } from 'react';
import Fuse from 'fuse.js';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  setDoc,
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
import SkeletonCategorySection from './components/SkeletonCategorySection';
import { useAdmin } from './hooks/useAdmin';
import { useTapCounter } from './hooks/useTapCounter';

// ===== Emoji icons for categories =====
function getCategoryIcon(name) {
  const n = (name || '').toLowerCase();
  if (n === 'all') return '🛍️';
  if (n === 'out of stock') return '🚫';
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

const OUT_OF_STOCK_KEY = 'Out of Stock';

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minTimeDone, setMinTimeDone] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [announcements, setAnnouncements] = useState({
    drops: [],
    newProducts: [],
  });

  // Sub-group word management (admin)
  const [subgroupWords, setSubgroupWords] = useState([]);
  const [newWordInput, setNewWordInput] = useState('');
  const [wordBusy, setWordBusy] = useState(false);

  // Header height measurement (for sticky category bar)
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(110);

  // Skip the very first render for the skeleton trigger
  const firstRenderRef = useRef(true);

  const { isAdmin, activateAdmin, deactivateAdmin } = useAdmin();
  const tapLogo = useTapCounter(activateAdmin, 10, 2000);

  useEffect(() => {
    const t = setTimeout(() => setMinTimeDone(true), 2500);
    return () => clearTimeout(t);
  }, []);

  // Measure header height (adjusts when admin mode toggles)
  useEffect(() => {
    const measure = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    const t = setTimeout(measure, 120);
    return () => {
      window.removeEventListener('resize', measure);
      clearTimeout(t);
    };
  }, [isAdmin]);

  // Show skeleton briefly when the user switches category
  // (Not on the very first load — the splash screen handles that)
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    setLoadingProducts(true);
    const t = setTimeout(() => setLoadingProducts(false), 300);
    return () => clearTimeout(t);
  }, [activeCategory]);

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

      let words = [];
      try {
        const wordsSnap = await getDocs(
          collection(db, 'catalogue_subgroup_words'),
        );
        words = wordsSnap.docs.map((d) => ({
          docId: d.id,
          word: (d.data().word || '').toLowerCase(),
          displayName:
            d.data().displayName || (d.data().word || '').toUpperCase(),
        }));
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
      setSubgroupWords(words);
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

  const outOfStockCount = useMemo(
    () => items.filter((i) => i.outOfStock).length,
    [items],
  );

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    const arr = Array.from(set).sort();
    if (outOfStockCount > 0) {
      arr.push(OUT_OF_STOCK_KEY);
    }
    return arr;
  }, [items, outOfStockCount]);

  const results = useMemo(() => {
    if (activeCategory === OUT_OF_STOCK_KEY) {
      let list = items.filter((i) => i.outOfStock);
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        list = list.filter((i) => (i.name || '').toLowerCase().includes(q));
      }
      return list;
    }

    let list = query.trim() ? fuse.search(query).map((r) => r.item) : items;
    if (activeCategory !== 'All') {
      list = list.filter((i) => i.category === activeCategory);
    }
    return list;
  }, [query, activeCategory, fuse, items]);

  // Group results by category
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
        const catItems = categoryGroups[cat];

        const showSubgroups =
          activeCategory !== 'All' && activeCategory !== OUT_OF_STOCK_KEY;

        if (!showSubgroups) {
          return {
            category: cat,
            totalItems: catItems.length,
            subgroups: [],
            flat: [...catItems].sort((a, b) =>
              (a.name || '').localeCompare(b.name || ''),
            ),
          };
        }

        const usedItems = new Set();
        const subgroupBuckets = {};

        subgroupWords.forEach(({ word, displayName }) => {
          catItems.forEach((item) => {
            if (usedItems.has(item.id)) return;
            const lowerName = (item.name || '').toLowerCase();
            if (lowerName.includes(word)) {
              const key = displayName.toUpperCase();
              if (!subgroupBuckets[key]) subgroupBuckets[key] = [];
              subgroupBuckets[key].push(item);
              usedItems.add(item.id);
            }
          });
        });

        const ungrouped = catItems.filter((i) => !usedItems.has(i.id));

        const subgroups = Object.keys(subgroupBuckets)
          .sort((a, b) => a.localeCompare(b))
          .map((sg) => ({
            subgroup: sg,
            items: subgroupBuckets[sg].sort((a, b) =>
              (a.name || '').localeCompare(b.name || ''),
            ),
          }));

        const sortedUngrouped = [...ungrouped].sort((a, b) =>
          (a.name || '').localeCompare(b.name || ''),
        );

        return {
          category: cat,
          totalItems: catItems.length,
          subgroups,
          flat: sortedUngrouped,
        };
      });
  }, [results, activeCategory, subgroupWords]);

  // Admin: add a sub-group word
  const handleAddWord = async () => {
    const word = newWordInput.trim();
    if (!word) return;

    const exists = subgroupWords.some((w) => w.word === word.toLowerCase());
    if (exists) {
      alert('This word is already registered.');
      return;
    }

    setWordBusy(true);
    try {
      const displayName = word.toUpperCase();
      const docRef = doc(collection(db, 'catalogue_subgroup_words'));
      await setDoc(docRef, {
        word: word.toLowerCase(),
        displayName,
        createdAt: serverTimestamp(),
      });
      setSubgroupWords((prev) => [
        ...prev,
        { docId: docRef.id, word: word.toLowerCase(), displayName },
      ]);
      setNewWordInput('');
    } catch (err) {
      console.error(err);
      alert('Failed to save word.');
    } finally {
      setWordBusy(false);
    }
  };

  // Admin: remove a sub-group word
  const handleRemoveWord = async (docId, displayName) => {
    if (
      !window.confirm(
        `Remove "${displayName}" from sub-groups?\n\nProducts will stay in the catalogue — they just won't be grouped under this word anymore.`,
      )
    ) {
      return;
    }
    setWordBusy(true);
    try {
      await deleteDoc(doc(db, 'catalogue_subgroup_words', docId));
      setSubgroupWords((prev) => prev.filter((w) => w.docId !== docId));
    } catch (err) {
      console.error(err);
      alert('Failed to remove word.');
    } finally {
      setWordBusy(false);
    }
  };

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

  // FIRST LOAD ONLY → splash screen
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
      <div ref={headerRef} className="sticky top-0 z-40 shadow-md">
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

        {isAdmin && (
          <div className="bg-purple-600 px-3 py-2 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newWordInput}
                onChange={(e) => setNewWordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddWord();
                }}
                placeholder='Type a word (e.g. "couscous")'
                className="flex-1 rounded-lg px-3 py-1.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-white"
              />
              <button
                onClick={handleAddWord}
                disabled={wordBusy || !newWordInput.trim()}
                className="rounded-lg bg-white text-purple-700 px-3 py-1.5 text-sm font-bold hover:bg-purple-50 disabled:opacity-50">
                {wordBusy ? '...' : 'Add'}
              </button>
            </div>

            {subgroupWords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {subgroupWords.map((w) => (
                  <span
                    key={w.docId}
                    className="inline-flex items-center gap-1 bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                    {w.displayName}
                    <button
                      onClick={() => handleRemoveWord(w.docId, w.displayName)}
                      className="text-white/80 hover:text-white font-bold leading-none">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <SearchBar query={query} setQuery={setQuery} />
      </div>

      <CategoryFilter
        categories={categories}
        active={activeCategory}
        setActive={setActiveCategory}
        outOfStockCount={outOfStockCount}
        topOffset={headerHeight}
      />

      <AnnouncementBanner
        drops={announcements.drops}
        newProducts={announcements.newProducts}
        isAdmin={isAdmin}
        onChanged={loadData}
        topOffset={headerHeight + 55}
      />

      <main className="p-4 mx-auto max-w-7xl">
        {loadingProducts ? (
          // Skeleton only shows AFTER the app has loaded (never on first load)
          <div className="space-y-10">
            <SkeletonCategorySection />
            <SkeletonCategorySection />
          </div>
        ) : results.length === 0 ? (
          <p className="text-center text-gray-500 py-10">
            {activeCategory === OUT_OF_STOCK_KEY
              ? 'No out-of-stock items 🎉'
              : 'No items found'}
          </p>
        ) : (
          <div className="space-y-10">
            {groupedResults.map((group) => (
              <section key={group.category}>
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

                {group.subgroups.length === 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {group.flat.map((item) => (
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
                ) : (
                  <div className="space-y-6">
                    {group.subgroups.map((sg) => (
                      <div key={sg.subgroup}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1.5 h-5 bg-purple-600 rounded-full" />
                          <h3 className="text-sm sm:text-base font-bold text-gray-700 uppercase tracking-wide">
                            {sg.subgroup}
                          </h3>
                          <span className="text-xs text-gray-400 font-medium">
                            ({sg.items.length})
                          </span>
                          <div className="flex-1 h-px bg-gray-200" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {sg.items.map((item) => (
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

                    {group.flat.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {group.flat.map((item) => (
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
                    )}
                  </div>
                )}
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
