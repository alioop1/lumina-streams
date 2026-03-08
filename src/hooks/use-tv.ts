import { useEffect } from 'react';

/**
 * Android TV D-pad navigation engine — v4
 * 
 * Optimized: cached DOM queries, minimal reflow, smooth vertical scrolling
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
    .filter(el => el.offsetParent !== null);

const getSidebarItems = (): HTMLElement[] => {
  const sidebar = document.querySelector('[data-sidebar]');
  return sidebar ? getVisibleFocusable(sidebar) : [];
};

interface NavRow {
  id: string;
  el: HTMLElement;
  items: HTMLElement[];
  vertical: boolean;
}

const getContentRows = (): NavRow[] => {
  const main = document.querySelector('main');
  if (!main) return [];
  const containers = Array.from(main.querySelectorAll<HTMLElement>('[data-nav-row]'));
  const rows: NavRow[] = [];

  for (const c of containers) {
    if (c.offsetHeight === 0) continue;
    const items = getVisibleFocusable(c);
    if (items.length === 0) continue;

    // Detect orientation
    let vertical = false;
    if (items.length > 1) {
      const r0 = items[0].getBoundingClientRect();
      const r1 = items[1].getBoundingClientRect();
      vertical = Math.abs(r1.top - r0.top) > Math.abs(r1.left - r0.left);
    }

    // Sort by primary axis
    if (vertical) {
      items.sort((a, b) => a.offsetTop - b.offsetTop);
    } else {
      items.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
    }

    rows.push({ id: c.getAttribute('data-nav-row')!, el: c, items, vertical });
  }

  // Sort rows by their DOM order (offsetTop relative to main)
  rows.sort((a, b) => {
    const aTop = a.el.offsetTop + (a.el.offsetParent as HTMLElement)?.offsetTop || 0;
    const bTop = b.el.offsetTop + (b.el.offsetParent as HTMLElement)?.offsetTop || 0;
    return aTop - bTop;
  });
  return rows;
};

const focusEl = (el: HTMLElement | undefined) => {
  if (!el) return;
  el.focus({ preventScroll: true });

  // Horizontal scroll within row
  const scrollParent = el.closest('.overflow-x-auto') as HTMLElement | null;
  if (scrollParent) {
    const parentRect = scrollParent.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const isRTL = resolveIsRTL();
    if (isRTL) {
      if (elRect.right > parentRect.right - 16 || elRect.left < parentRect.left + 16) {
        scrollParent.scrollLeft += elRect.right - parentRect.right + 24;
      }
    } else {
      if (elRect.left < parentRect.left + 16 || elRect.right > parentRect.right - 16) {
        scrollParent.scrollLeft += elRect.left - parentRect.left - 24;
      }
    }
  }

  // Vertical scroll: ensure element is visible in main
  requestAnimationFrame(() => {
    const mainEl = document.querySelector('main');
    if (!mainEl) return;
    const mainRect = mainEl.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    if (elRect.bottom > mainRect.bottom - 40) {
      mainEl.scrollTop += elRect.bottom - mainRect.bottom + 80;
    } else if (elRect.top < mainRect.top + 40) {
      mainEl.scrollTop -= mainRect.top - elRect.top + 80;
    }
  });
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
      if (now - lastNav < 100) { e.preventDefault(); return; }
      lastNav = now;
      e.preventDefault();
      e.stopPropagation();

      const sidebarItems = getSidebarItems();
      const rows = getContentRows();

      // Nothing focused
      if (!active || active === document.body || !active.classList.contains('tv-focus')) {
        focusEl(sidebarItems[0] || rows[0]?.items[0]);
        return;
      }

      // ─── Go to sidebar ───
      const goToSidebar = () => {
        if (sidebarItems.length === 0) return;
        const y = active.getBoundingClientRect().top + active.getBoundingClientRect().height / 2;
        let best = sidebarItems[0];
        let bestD = Infinity;
        for (const si of sidebarItems) {
          const d = Math.abs(si.getBoundingClientRect().top + si.getBoundingClientRect().height / 2 - y);
          if (d < bestD) { bestD = d; best = si; }
        }
        best.focus();
      };

      // ─── Go to content from sidebar ───
      const goToContent = () => {
        if (rows.length === 0) return;
        // Find the first visible row
        const mainEl = document.querySelector('main');
        const scrollTop = mainEl?.scrollTop || 0;
        const viewportMid = (mainEl?.getBoundingClientRect().top || 0) + (mainEl?.clientHeight || window.innerHeight) / 2;
        
        let best = rows[0];
        let bestDist = Infinity;
        for (const row of rows) {
          const rowRect = row.el.getBoundingClientRect();
          const d = Math.abs(rowRect.top + rowRect.height / 2 - viewportMid);
          if (d < bestDist) { bestDist = d; best = row; }
        }
        
        const idx = best.vertical ? 0 : (isRTL ? best.items.length - 1 : 0);
        focusEl(best.items[idx]);
      };

      // ═══════════════════════════════════════
      // SIDEBAR NAVIGATION
      // ═══════════════════════════════════════
      if (isInSidebar(active)) {
        const idx = sidebarItems.indexOf(active);
        if (key === 'ArrowUp' && idx > 0) {
          sidebarItems[idx - 1].focus();
        } else if (key === 'ArrowDown' && idx < sidebarItems.length - 1) {
          sidebarItems[idx + 1].focus();
        } else if (key === towardContent) {
          goToContent();
        }
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

      const goToPrevRow = () => {
        if (activeRowIdx > 0) {
          const prev = rows[activeRowIdx - 1];
          const idx = prev.vertical ? 0 : (isRTL ? prev.items.length - 1 : 0);
          focusEl(prev.items[idx]);
        } else {
          goToSidebar();
        }
      };

      const goToNextRow = () => {
        if (activeRowIdx < rows.length - 1) {
          const next = rows[activeRowIdx + 1];
          const idx = next.vertical ? 0 : (isRTL ? next.items.length - 1 : 0);
          focusEl(next.items[idx]);
        }
      };

      // VERTICAL ROW
      if (currentRow.vertical) {
        if (key === 'ArrowUp') {
          activeColIdx > 0 ? focusEl(currentRow.items[activeColIdx - 1]) : goToPrevRow();
        } else if (key === 'ArrowDown') {
          activeColIdx < currentRow.items.length - 1 ? focusEl(currentRow.items[activeColIdx + 1]) : goToNextRow();
        } else if (key === towardSidebar) {
          goToSidebar();
        }
        return;
      }

      // HORIZONTAL ROW
      if (key === 'ArrowRight') {
        if (activeColIdx < currentRow.items.length - 1) {
          focusEl(currentRow.items[activeColIdx + 1]);
        } else if (towardSidebar === 'ArrowRight') {
          goToSidebar();
        }
      } else if (key === 'ArrowLeft') {
        if (activeColIdx > 0) {
          focusEl(currentRow.items[activeColIdx - 1]);
        } else if (towardSidebar === 'ArrowLeft') {
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
    }, 300);

    return () => {
      window.removeEventListener('keydown', handleKey, true);
      clearTimeout(t);
    };
  }, [enabled]);
};
