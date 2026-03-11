import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const focusMap = new Map<string, string>();

export const useFocusMemory = () => {
  const location = useLocation();
  const path = location.pathname;

  // Save focus on leaving
  useEffect(() => {
    return () => {
      const active = document.activeElement as HTMLElement;
      if (active && active !== document.body) {
        const row = active.closest('[data-nav-row]');
        const rowId = row?.getAttribute('data-nav-row');
        const idx = active.getAttribute('data-card-index');
        if (rowId) {
          focusMap.set(path, `${rowId}:${idx || '0'}`);
        }
      }
    };
  }, [path]);

  // Restore focus on entering
  useEffect(() => {
    const saved = focusMap.get(path);
    if (!saved) return;
    const [rowId, idx] = saved.split(':');
    const timer = setTimeout(() => {
      const row = document.querySelector(`[data-nav-row="${rowId}"]`);
      if (!row) return;
      const items = Array.from(row.querySelectorAll<HTMLElement>('.tv-focus'));
      const target = items[parseInt(idx)] || items[0];
      target?.focus({ preventScroll: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [path]);
};
