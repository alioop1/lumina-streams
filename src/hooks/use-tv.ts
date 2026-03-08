import { useEffect, useState } from 'react';

// ─── TV Device Detection ───

const TV_UA = /Android TV|GoogleTV|SmartTV|SMART-TV|HbbTV|AFT|BRAVIA|TV/i;
const ATV_HINT = /AFT|BRAVIA|MIBOX|SHIELD|ADT-|SmartTV|GoogleTV/i;

export const detectTVDevice = () => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return (
    localStorage.getItem('force-tv-mode') === 'true' ||
    new URLSearchParams(location.search).get('tv') === '1' ||
    TV_UA.test(ua) ||
    (ua.includes('Android') && ATV_HINT.test(ua)) ||
    Boolean((window as any).Capacitor)
  );
};

export const useIsTVDevice = () => {
  const [isTV, setIsTV] = useState(detectTVDevice);

  useEffect(() => {
    const onKey = () => {
      if (!isTV) {
        localStorage.setItem('force-tv-mode', 'true');
        setIsTV(true);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [isTV]);

  return isTV;
};

// ─── Key Normalisation ───

const KEYCODE_MAP: Record<number, string> = {
  13: 'Enter', 19: 'ArrowUp', 20: 'ArrowDown', 21: 'ArrowLeft',
  22: 'ArrowRight', 23: 'Enter', 32: 'Enter', 37: 'ArrowLeft',
  38: 'ArrowUp', 39: 'ArrowRight', 40: 'ArrowDown', 66: 'Enter',
  4: 'Back', 27: 'Back',
};

const normalizeKey = (e: KeyboardEvent): string => {
  const k = (e.key || '').toLowerCase();
  if (k === 'arrowup' || k === 'up' || k === 'dpadup' || k === 'dpad_up') return 'ArrowUp';
  if (k === 'arrowdown' || k === 'down' || k === 'dpaddown' || k === 'dpad_down') return 'ArrowDown';
  if (k === 'arrowleft' || k === 'left' || k === 'dpadleft' || k === 'dpad_left') return 'ArrowLeft';
  if (k === 'arrowright' || k === 'right' || k === 'dpadright' || k === 'dpad_right') return 'ArrowRight';
  if (k === 'enter' || k === 'select' || k === 'ok' || k === 'center' || k === 'dpad_center') return 'Enter';
  if (k === 'escape' || k === 'backspace' || k === 'goback' || k === 'back') return 'Back';
  if (k === ' ') return 'Enter'; // Space = Enter on TV
  if (e.code?.startsWith('Arrow')) return e.code;
  return KEYCODE_MAP[e.keyCode || 0] || '';
};

// ─── Row-Based Navigation Engine ───
// Architecture:
//   - Sidebar: vertical list, Up/Down within, Right→content
//   - Content: rows marked with [data-nav-row], Left/Right within, Up/Down between rows
//   - Every focusable element has class .tv-focus
//   - At leftmost of content row → Left goes to sidebar
//   - This is 100% deterministic — no spatial scoring

interface NavRow {
  id: string;
  y: number;
  items: HTMLElement[];
}

const getNavRows = (): NavRow[] => {
  const containers = Array.from(document.querySelectorAll<HTMLElement>('main [data-nav-row]'));
  const rows: NavRow[] = [];

  for (const container of containers) {
    const rect = container.getBoundingClientRect();
    // Skip invisible containers
    if (rect.height === 0 || rect.width === 0) continue;

    const items = Array.from(container.querySelectorAll<HTMLElement>('.tv-focus'))
      .filter(el => {
        if (el.offsetParent === null) return false;
        if (el.hasAttribute('disabled')) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });

    if (items.length === 0) continue;

    // Sort items by X position (accounts for RTL via getBoundingClientRect)
    items.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);

    rows.push({
      id: container.getAttribute('data-nav-row') || '',
      y: rect.top,
      items,
    });
  }

  // Sort rows by Y position
  rows.sort((a, b) => a.y - b.y);
  return rows;
};

const getSidebarItems = (): HTMLElement[] => {
  const sidebar = document.querySelector('[data-sidebar]');
  if (!sidebar) return [];
  return Array.from(sidebar.querySelectorAll<HTMLElement>('.tv-focus'))
    .filter(el => {
      if (el.offsetParent === null) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
};

const focusEl = (el: HTMLElement | null | undefined) => {
  if (!el) return false;
  el.focus({ preventScroll: false });
  el.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
  return true;
};

export const useTVGlobalNavigation = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;

    let lastNav = 0;
    const THROTTLE = 120;

    const handleKey = (e: KeyboardEvent) => {
      // Don't interfere with video player
      if (document.querySelector('[data-video-player="true"]')) return;
      if (e.defaultPrevented) return;

      const key = normalizeKey(e);
      if (!key) return;

      // Don't intercept text input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        if (key === 'Enter' || key === 'Back') {
          // Allow Enter to submit / Back to blur
        } else {
          return; // Let arrow keys work in input
        }
      }

      const isRTL = document.documentElement.dir === 'rtl' || document.body.dir === 'rtl';

      // ── Enter: click focused element ──
      if (key === 'Enter') {
        const active = document.activeElement as HTMLElement;
        if (active && active !== document.body) {
          e.preventDefault();
          e.stopPropagation();
          active.click();
        }
        return;
      }

      // ── Back: let app handle (don't preventDefault) ──
      if (key === 'Back') return;

      // ── Arrow keys ──
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;

      // Throttle
      const now = performance.now();
      if (e.repeat || now - lastNav < THROTTLE) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      lastNav = now;
      e.preventDefault();
      e.stopPropagation();

      const sidebarItems = getSidebarItems();
      const rows = getNavRows();
      const active = document.activeElement as HTMLElement;

      // Nothing focused → focus first content item
      if (!active || active === document.body) {
        if (rows.length > 0 && rows[0].items.length > 0) {
          focusEl(rows[0].items[0]);
        } else if (sidebarItems.length > 0) {
          focusEl(sidebarItems[0]);
        }
        return;
      }

      // ── Check if active is in sidebar ──
      const sidebarIdx = sidebarItems.indexOf(active);
      if (sidebarIdx !== -1) {
        // Effective direction (flip horizontal for RTL)
        const effectiveKey = isRTL
          ? (key === 'ArrowLeft' ? 'ArrowRight' : key === 'ArrowRight' ? 'ArrowLeft' : key)
          : key;

        if (effectiveKey === 'ArrowUp') {
          if (sidebarIdx > 0) focusEl(sidebarItems[sidebarIdx - 1]);
        } else if (effectiveKey === 'ArrowDown') {
          if (sidebarIdx < sidebarItems.length - 1) focusEl(sidebarItems[sidebarIdx + 1]);
        } else if (effectiveKey === 'ArrowRight') {
          // Move to content: find row closest to sidebar item's Y
          const activeY = active.getBoundingClientRect().top + active.getBoundingClientRect().height / 2;
          let bestRow = rows[0];
          let bestDist = Infinity;
          for (const row of rows) {
            const d = Math.abs(row.y - activeY);
            if (d < bestDist) { bestDist = d; bestRow = row; }
          }
          if (bestRow && bestRow.items.length > 0) {
            // In RTL, "first" item visually is the rightmost (last in sorted array)
            focusEl(isRTL ? bestRow.items[bestRow.items.length - 1] : bestRow.items[0]);
          }
        }
        // ArrowLeft in sidebar: do nothing
        return;
      }

      // ── Active is in content ──
      // Find which row the active element is in
      let activeRowIdx = -1;
      let activeColIdx = -1;
      for (let r = 0; r < rows.length; r++) {
        const colIdx = rows[r].items.indexOf(active);
        if (colIdx !== -1) {
          activeRowIdx = r;
          activeColIdx = colIdx;
          break;
        }
      }

      if (activeRowIdx === -1) {
        // Active element not in any nav row — focus first row
        if (rows.length > 0) focusEl(rows[0].items[0]);
        return;
      }

      const currentRow = rows[activeRowIdx];

      // Effective direction (flip horizontal for RTL)
      const effectiveKey = isRTL
        ? (key === 'ArrowLeft' ? 'ArrowRight' : key === 'ArrowRight' ? 'ArrowLeft' : key)
        : key;

      switch (effectiveKey) {
        case 'ArrowRight': {
          if (activeColIdx < currentRow.items.length - 1) {
            focusEl(currentRow.items[activeColIdx + 1]);
          }
          // At end of row: do nothing (no wrap)
          break;
        }
        case 'ArrowLeft': {
          if (activeColIdx > 0) {
            focusEl(currentRow.items[activeColIdx - 1]);
          } else {
            // At start of row → go to sidebar
            if (sidebarItems.length > 0) {
              // Find sidebar item closest to current Y
              const activeY = active.getBoundingClientRect().top + active.getBoundingClientRect().height / 2;
              let best = sidebarItems[0];
              let bestDist = Infinity;
              for (const si of sidebarItems) {
                const siY = si.getBoundingClientRect().top + si.getBoundingClientRect().height / 2;
                const d = Math.abs(siY - activeY);
                if (d < bestDist) { bestDist = d; best = si; }
              }
              focusEl(best);
            }
          }
          break;
        }
        case 'ArrowDown': {
          if (activeRowIdx < rows.length - 1) {
            const nextRow = rows[activeRowIdx + 1];
            // Try to maintain column position, clamp to row length
            const nextColIdx = Math.min(activeColIdx, nextRow.items.length - 1);
            focusEl(nextRow.items[nextColIdx]);
          }
          break;
        }
        case 'ArrowUp': {
          if (activeRowIdx > 0) {
            const prevRow = rows[activeRowIdx - 1];
            const prevColIdx = Math.min(activeColIdx, prevRow.items.length - 1);
            focusEl(prevRow.items[prevColIdx]);
          } else {
            // At top row → optionally go to sidebar
            if (sidebarItems.length > 0) {
              focusEl(sidebarItems[0]);
            }
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKey, true);

    // Auto-focus first content element
    const t = setTimeout(() => {
      const a = document.activeElement;
      if (!a || a === document.body) {
        const rows = getNavRows();
        if (rows.length > 0 && rows[0].items.length > 0) {
          focusEl(rows[0].items[0]);
        }
      }
    }, 150);

    return () => {
      window.removeEventListener('keydown', handleKey, true);
      clearTimeout(t);
    };
  }, [enabled]);
};
