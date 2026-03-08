import { useEffect } from 'react';

/**
 * Android TV D-pad navigation engine.
 * 
 * Architecture:
 * - Every focusable element: class="tv-focus" + tabIndex (or native button)
 * - Elements grouped in rows: parent has data-nav-row="uniqueId"
 * - Sidebar marked with data-sidebar
 * - ArrowUp/Down: move between rows
 * - ArrowLeft/Right: move within a row (RTL-aware)
 * - Sidebar ↔ Content transition at row edges
 */

// ─── Key Normalisation ───

const KEYCODE_MAP: Record<number, string> = {
  13: 'Enter', 19: 'ArrowUp', 20: 'ArrowDown', 21: 'ArrowLeft',
  22: 'ArrowRight', 23: 'Enter', 32: 'Enter', 37: 'ArrowLeft',
  38: 'ArrowUp', 39: 'ArrowRight', 40: 'ArrowDown', 66: 'Enter',
  4: 'Back', 27: 'Back',
};

const normalizeKey = (e: KeyboardEvent): string => {
  const k = (e.key || '').toLowerCase();
  if (k === 'arrowup' || k === 'up' || k === 'dpadup') return 'ArrowUp';
  if (k === 'arrowdown' || k === 'down' || k === 'dpaddown') return 'ArrowDown';
  if (k === 'arrowleft' || k === 'left' || k === 'dpadleft') return 'ArrowLeft';
  if (k === 'arrowright' || k === 'right' || k === 'dpadright') return 'ArrowRight';
  if (k === 'enter' || k === 'select' || k === 'ok' || k === 'center') return 'Enter';
  if (k === 'escape' || k === 'backspace' || k === 'goback' || k === 'back') return 'Back';
  if (k === ' ') return 'Enter';
  if (e.code?.startsWith('Arrow')) return e.code;
  return KEYCODE_MAP[e.keyCode || 0] || '';
};

// ─── Helpers ───

const getVisibleFocusable = (container: Element): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>('.tv-focus'))
    .filter(el => el.offsetParent !== null && el.getBoundingClientRect().width > 0);

const getSidebarItems = (): HTMLElement[] => {
  const sidebar = document.querySelector('[data-sidebar]');
  return sidebar ? getVisibleFocusable(sidebar) : [];
};

interface NavRow {
  id: string;
  y: number;
  items: HTMLElement[];
}

const getContentRows = (): NavRow[] => {
  const main = document.querySelector('main');
  if (!main) return [];
  const containers = Array.from(main.querySelectorAll<HTMLElement>('[data-nav-row]'));
  const rows: NavRow[] = [];

  for (const c of containers) {
    const rect = c.getBoundingClientRect();
    if (rect.height === 0) continue;
    const items = getVisibleFocusable(c);
    if (items.length === 0) continue;
    items.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
    rows.push({ id: c.getAttribute('data-nav-row')!, y: rect.top, items });
  }

  rows.sort((a, b) => a.y - b.y);
  return rows;
};

const focusEl = (el: HTMLElement | undefined) => {
  if (!el) return;
  el.focus({ preventScroll: false });
  el.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
};

const isInSidebar = (el: HTMLElement): boolean => !!el.closest('[data-sidebar]');

// ─── Main Hook ───

export const useTVGlobalNavigation = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;

    let lastNav = 0;

    const handleKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (document.querySelector('[data-video-player="true"]')) return;

      const key = normalizeKey(e);
      if (!key) return;

      // Don't intercept typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if ((tag === 'INPUT' || tag === 'TEXTAREA') && !['Enter', 'Back', 'ArrowUp', 'ArrowDown'].includes(key)) return;

      const isRTL = document.documentElement.dir === 'rtl' || document.body.dir === 'rtl';

      // Enter → click
      if (key === 'Enter') {
        const active = document.activeElement as HTMLElement;
        if (active && active !== document.body) {
          e.preventDefault();
          active.click();
        }
        return;
      }

      // Back → let app handle
      if (key === 'Back') return;

      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;

      // Throttle
      const now = performance.now();
      if (now - lastNav < 120) { e.preventDefault(); return; }
      lastNav = now;
      e.preventDefault();
      e.stopPropagation();

      const active = document.activeElement as HTMLElement;
      const sidebarItems = getSidebarItems();
      const rows = getContentRows();

      // Nothing focused → focus sidebar
      if (!active || active === document.body || !active.classList.contains('tv-focus')) {
        focusEl(sidebarItems[0] || rows[0]?.items[0]);
        return;
      }

      // Flip horizontal for RTL
      const effectiveKey = isRTL
        ? (key === 'ArrowLeft' ? 'ArrowRight' : key === 'ArrowRight' ? 'ArrowLeft' : key)
        : key;

      // ── Sidebar navigation ──
      if (isInSidebar(active)) {
        const idx = sidebarItems.indexOf(active);
        if (effectiveKey === 'ArrowUp' && idx > 0) focusEl(sidebarItems[idx - 1]);
        else if (effectiveKey === 'ArrowDown' && idx < sidebarItems.length - 1) focusEl(sidebarItems[idx + 1]);
        else if (effectiveKey === 'ArrowRight' && rows.length > 0) {
          // Move to content: find nearest row by Y
          const activeY = active.getBoundingClientRect().top + active.getBoundingClientRect().height / 2;
          let best = rows[0];
          let bestDist = Infinity;
          for (const row of rows) {
            const d = Math.abs(row.y - activeY);
            if (d < bestDist) { bestDist = d; best = row; }
          }
          focusEl(isRTL ? best.items[best.items.length - 1] : best.items[0]);
        }
        return;
      }

      // ── Content navigation ──
      let activeRowIdx = -1, activeColIdx = -1;
      for (let r = 0; r < rows.length; r++) {
        const col = rows[r].items.indexOf(active);
        if (col !== -1) { activeRowIdx = r; activeColIdx = col; break; }
      }

      if (activeRowIdx === -1) {
        focusEl(rows[0]?.items[0] || sidebarItems[0]);
        return;
      }

      const currentRow = rows[activeRowIdx];

      switch (effectiveKey) {
        case 'ArrowRight':
          if (activeColIdx < currentRow.items.length - 1) focusEl(currentRow.items[activeColIdx + 1]);
          break;
        case 'ArrowLeft':
          if (activeColIdx > 0) focusEl(currentRow.items[activeColIdx - 1]);
          else if (sidebarItems.length > 0) {
            // Go to sidebar — find closest by Y
            const y = active.getBoundingClientRect().top + active.getBoundingClientRect().height / 2;
            let best = sidebarItems[0];
            let bestD = Infinity;
            for (const si of sidebarItems) {
              const d = Math.abs(si.getBoundingClientRect().top + si.getBoundingClientRect().height / 2 - y);
              if (d < bestD) { bestD = d; best = si; }
            }
            focusEl(best);
          }
          break;
        case 'ArrowDown':
          if (activeRowIdx < rows.length - 1) {
            const next = rows[activeRowIdx + 1];
            focusEl(next.items[Math.min(activeColIdx, next.items.length - 1)]);
          }
          break;
        case 'ArrowUp':
          if (activeRowIdx > 0) {
            const prev = rows[activeRowIdx - 1];
            focusEl(prev.items[Math.min(activeColIdx, prev.items.length - 1)]);
          } else if (sidebarItems.length > 0) {
            focusEl(sidebarItems[0]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKey, true);

    // Auto-focus on mount
    const t = setTimeout(() => {
      const a = document.activeElement;
      if (!a || a === document.body) {
        const rows = getContentRows();
        focusEl(rows[0]?.items[0] || getSidebarItems()[0]);
      }
    }, 200);

    return () => {
      window.removeEventListener('keydown', handleKey, true);
      clearTimeout(t);
    };
  }, [enabled]);
};
