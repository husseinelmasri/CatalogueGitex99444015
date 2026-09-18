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
import ItemCard from './components/ItemCard';
import ItemModal from './components/ItemModal';
import PriceEditModal from './components/PriceEditModal';
import PriceChangeBanner from './components/PriceChangeBanner';
import GeoBlocked from './components/GeoBlocked';
import { useAdmin } from './hooks/useAdmin';
import { useTapCounter } from './hooks/useTapCounter';
import { useGeoCheck } from './hooks/useGeoCheck';

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  const { isAdmin, activateAdmin, deactivateAdmin } = useAdmin();
  const tapLogo = useTapCounter(activateAdmin, 10, 2000);
  const geoStatus = useGeoCheck();

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
            archived: p.archived,
            promo: promoMap[d.id] || null,
            outOfStock: outOfStock[d.id] || null,
          };
        })
        .filter((item) => item.name && !item.archived);

      setItems(data);
      setAnnouncements(anns);
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

  const results = useMemo(() => {
    if (!query.trim()) return items;
    return fuse.search(query).map((r) => r.item);
  }, [query, fuse]);

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

  // Loading / geo check screen
  if (loading || geoStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        {geoStatus === 'checking'
          ? 'Checking your location...'
          : 'Loading items...'}
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 p-4 text-center">
        Error: {error}
      </div>
    );
  }

  // Geo-block non-admins outside the store radius
  // if (!isAdmin && (geoStatus === 'denied' || geoStatus === 'error')) {
  //   return <GeoBlocked reason={geoStatus} />;
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header + search bar in one block */}
      <div className="sticky top-0 z-40 shadow-md">
        <header className="bg-brand px-4 pt-5 pb-2 text-center text-white">
          <h1
            onClick={tapLogo}
            className="text-xl font-bold select-none cursor-default">
            Price Checker
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

      <PriceChangeBanner
        changes={announcements}
        isAdmin={isAdmin}
        onChanged={loadData}
      />

      <main className="p-4 mx-auto max-w-7xl">
        {results.length === 0 ? (
          <p className="text-center text-gray-500 py-10">No items found</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {results.map((item) => (
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
      </main>

      <footer className="p-4 text-center text-xs text-gray-400">
        {results.length} item{results.length !== 1 ? 's' : ''}
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
