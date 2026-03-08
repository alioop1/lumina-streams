import { useEffect } from 'react';

/**
 * Android TV D-pad navigation engine — v3
 * 
 * Architecture:
 * - Every focusable element: class="tv-focus"
 * - Elements grouped: parent has data-nav-row="uniqueId"
 * - Sidebar: data-sidebar
 * - Auto-detects horizontal vs vertical rows
 * - RTL-aware: sidebar on right, content on left
 * - Physical arrow keys: always map to screen direction
 * - Sidebar transition: based on layout direction
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
  vertical: boolean;
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

    // Detect orientation
    let vertical = false;
    if (items.length > 1) {
      const rects = items.map(el => el.getBoundingClientRect());
      const xSpread = Math.max(...rects.map(r => r.left)) - Math.min(...rects.map(r => r.left));
      const ySpread = Math.max(...rects.map(r => r.top)) - Math.min(...rects.map(r => r.top));
      vertical = ySpread > xSpread;
    }

    // Sort by primary axis position
    if (vertical) {
      items.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    } else {
      items.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
    }

    rows.push({ id: c.getAttribute('data-nav-row')!, y: rect.top, items, vertical });
  }

  rows.sort((a, b) => a.y - b.y);
  return rows;
};

const focusEl = (el: HTMLElement | undefined) => {
  if (!el) return;
  el.focus({ preventScroll: true });
  // Scroll the element's parent scrollable container to show it at the start
  const scrollParent = el.closest('.overflow-x-auto');
  if (scrollParent) {
    const isRTL = resolveIsRTL();
    const parentRect = scrollParent.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    // Calculate offset to place element at the start edge with some padding
    if (isRTL) {
      const offset = elRect.right - parentRect.right + 24;
      scrollParent.scrollLeft += offset;
    } else {
      const offset = elRect.left - parentRect.left - 24;
      scrollParent.scrollLeft += offset;
    }
  } else {
    el.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
  }
};

const isInSidebar = (el: HTMLElement): boolean => !!el.closest('[data-sidebar]');

const resolveIsRTL = (): boolean => {
  return document.documentElement.getAttribute('dir') === 'rtl' ||
         document.body.getAttribute('dir') === 'rtl';
};

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

      const active = document.activeElement as HTMLElement;
      const isRTL = resolveIsRTL();

      // In RTL: sidebar is on RIGHT, content on LEFT
      // towardSidebar = physical direction toward the sidebar
      const towardSidebar = isRTL ? 'ArrowRight' : 'ArrowLeft';
      const towardContent = isRTL ? 'ArrowLeft' : 'ArrowRight';

      // Enter → click
      if (key === 'Enter') {
        if (active && active !== document.body) {
          e.preventDefault();
          active.click();
        }
        return;
      }

      if (key === 'Back') return;
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;

      // Throttle
      const now = performance.now();
      if (now - lastNav < 80) { e.preventDefault(); return; }
      lastNav = now;
      e.preventDefault();
      e.stopPropagation();

      const sidebarItems = getSidebarItems();
      const rows = getContentRows();

      // Nothing focused → focus first content or sidebar
      if (!active || active === document.body || !active.classList.contains('tv-focus')) {
        focusEl(sidebarItems[0] || rows[0]?.items[0]);
        return;
      }

      // ─── Helper: go to sidebar closest to current Y ───
      const goToSidebar = () => {
        if (sidebarItems.length === 0) return;
        const y = active.getBoundingClientRect().top + active.getBoundingClientRect().height / 2;
        let best = sidebarItems[0];
        let bestD = Infinity;
        for (const si of sidebarItems) {
          const d = Math.abs(si.getBoundingClientRect().top + si.getBoundingClientRect().height / 2 - y);
          if (d < bestD) { bestD = d; best = si; }
        }
        focusEl(best);
      };

      // ─── Helper: go to content from sidebar ───
      const goToContent = () => {
        if (rows.length === 0) return;
        const activeY = active.getBoundingClientRect().top + active.getBoundingClientRect().height / 2;
        let best = rows[0];
        let bestDist = Infinity;
        for (const row of rows) {
          const d = Math.abs(row.y - activeY);
          if (d < bestDist) { bestDist = d; best = row; }
        }
        // Focus the item nearest to sidebar:
        // In RTL sidebar is RIGHT → nearest = rightmost = last in sorted array
        // In LTR sidebar is LEFT → nearest = leftmost = first in sorted array
        if (best.vertical) {
          focusEl(best.items[0]); // vertical list: always start at top
        } else {
          const idx = isRTL ? best.items.length - 1 : 0;
          focusEl(best.items[idx]);
        }
      };

      // ═══════════════════════════════════════
      // SIDEBAR NAVIGATION (always vertical)
      // ═══════════════════════════════════════
      if (isInSidebar(active)) {
        const idx = sidebarItems.indexOf(active);
        if (key === 'ArrowUp' && idx > 0) {
          focusEl(sidebarItems[idx - 1]);
        } else if (key === 'ArrowDown' && idx < sidebarItems.length - 1) {
          focusEl(sidebarItems[idx + 1]);
        } else if (key === towardContent) {
          goToContent();
        }
        // towardSidebar from sidebar = do nothing
        return;
      }

      // ═══════════════════════════════════════
      // CONTENT NAVIGATION
      // ═══════════════════════════════════════
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

      // ─── Move to adjacent row ───
      const goToPrevRow = () => {
        if (activeRowIdx > 0) {
          const prev = rows[activeRowIdx - 1];
          // Always start from the first item in the row (respecting RTL)
          const isRTL = resolveIsRTL();
          const idx = prev.vertical ? 0 : (isRTL ? prev.items.length - 1 : 0);
          focusEl(prev.items[idx]);
        } else {
          goToSidebar();
        }
      };

      const goToNextRow = () => {
        if (activeRowIdx < rows.length - 1) {
          const next = rows[activeRowIdx + 1];
          // Always start from the first item in the row (respecting RTL)
          const isRTL = resolveIsRTL();
          const idx = next.vertical ? 0 : (isRTL ? next.items.length - 1 : 0);
          focusEl(next.items[idx]);
        }
      };

      // ═══════════════════════════════════════
      // VERTICAL ROW (e.g. Settings list)
      // Up/Down = within row, towardSidebar = sidebar
      // ═══════════════════════════════════════
      if (currentRow.vertical) {
        if (key === 'ArrowUp') {
          if (activeColIdx > 0) {
            focusEl(currentRow.items[activeColIdx - 1]);
          } else {
            goToPrevRow();
          }
        } else if (key === 'ArrowDown') {
          if (activeColIdx < currentRow.items.length - 1) {
            focusEl(currentRow.items[activeColIdx + 1]);
          } else {
            goToNextRow();
          }
        } else if (key === towardSidebar) {
          goToSidebar();
        }
        // towardContent in vertical list = do nothing
        return;
      }

      // ═══════════════════════════════════════
      // HORIZONTAL ROW (e.g. movie card rows)
      // Left/Right = within row (physical direction)
      // At edge toward sidebar = go to sidebar
      // Up/Down = between rows
      // ═══════════════════════════════════════
      if (key === 'ArrowRight') {
        if (activeColIdx < currentRow.items.length - 1) {
          focusEl(currentRow.items[activeColIdx + 1]);
        } else if (towardSidebar === 'ArrowRight') {
          // RTL: at rightmost item, going right = toward sidebar
          goToSidebar();
        }
      } else if (key === 'ArrowLeft') {
        if (activeColIdx > 0) {
          focusEl(currentRow.items[activeColIdx - 1]);
        } else if (towardSidebar === 'ArrowLeft') {
          // LTR: at leftmost item, going left = toward sidebar
          goToSidebar();
        }
      } else if (key === 'ArrowUp') {
        goToPrevRow();
      } else if (key === 'ArrowDown') {
        goToNextRow();
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
