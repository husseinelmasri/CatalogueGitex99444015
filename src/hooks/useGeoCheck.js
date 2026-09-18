import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { distanceMeters } from '../utils/geo';

export function useGeoCheck() {
  const [status, setStatus] = useState('checking');
  // status: "checking" | "allowed" | "denied" | "error"

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        // 1. Load store locations from Firestore
        const snap = await getDoc(doc(db, 'catalogue_settings', 'locations'));
        if (!snap.exists()) {
          console.warn('No locations document found — allowing everyone.');
          if (!cancelled) setStatus('allowed');
          return;
        }

        const data = snap.data();
        const radius = Number(data.radius) || 200;

        const stores = [
          {
            name: data.store1Name || 'Store 1',
            lat: Number(data.store1Lat),
            lng: Number(data.store1Lng),
          },
          {
            name: data.store2Name || 'Store 2',
            lat: Number(data.store2Lat),
            lng: Number(data.store2Lng),
          },
        ].filter((s) => !isNaN(s.lat) && !isNaN(s.lng));

        // 2. Ask for the visitor's location
        if (!navigator.geolocation) {
          if (!cancelled) setStatus('denied');
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelled) return;
            const { latitude, longitude } = pos.coords;

            // 3. Check distance to each store
            const inRange = stores.some(
              (s) =>
                distanceMeters(latitude, longitude, s.lat, s.lng) <= radius,
            );

            setStatus(inRange ? 'allowed' : 'denied');
          },
          (err) => {
            console.warn('Geolocation error:', err.message);
            if (!cancelled) setStatus('denied');
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          },
        );
      } catch (err) {
        console.error('Geo check error:', err);
        if (!cancelled) setStatus('error');
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
