import { useEffect, useState } from 'react';

const ADMIN_PASSWORD = 'changeme123'; // ← CHANGE THIS
const STORAGE_KEY = 'catalogue_admin';

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);

  // Restore admin session on load
  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === '1') {
      setIsAdmin(true);
    }
  }, []);

  const activateAdmin = () => {
    const input = window.prompt('Enter admin password:');
    if (input === ADMIN_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, '1');
      setIsAdmin(true);
      return true;
    }
    if (input !== null) {
      alert('Wrong password.');
    }
    return false;
  };

  const deactivateAdmin = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setIsAdmin(false);
  };

  return { isAdmin, activateAdmin, deactivateAdmin };
}
