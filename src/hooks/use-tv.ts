import { useEffect } from 'react';

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

const resolveIsRTL = (): boolean => {
  return document.documentElement.getAttribute('dir') === 'rtl' ||
    document.body.getAttribute('dir') === 'rtl';
};

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
  grid: boolean;
  gridCols: number;
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

    let vertical = false;
    let grid = false;
    let gridCols = 1;

    if (items.length > 1) {
      const rects = items.map(el => el.getBoundingClientRect());
      const xSpread = Math.max(...rects.map(r => r.left)) - Math.min(...rects.map(r => r.left));
      const ySpread = Math.max(...rects.map(r => r.top)) - Math.min(...rects.map(r => r.top));

      if (xSpread > 20 && ySpread > 20 && items.length > 2) {
        grid = true;
        const firstY = rects[0].top;
        gridCols = rects.filter(r => Math.abs(r.top - firstY) < 20).length;
        if (gridCols < 1) gridCols = 1;
      } else {
        vertical = ySpread > xSpread;
      }
    }

    if (vertical) {
      items.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    } else if (grid) {
      items.sort((a, b) => {
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        const rowDiff = Math.round((ar.top - br.top) / 20);
        if (rowDiff !== 0) return rowDiff;
        return ar.left - br.left;
      });
    } else {
      items.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
    }

    rows.push({ id: c.getAttribute('data-nav-row')!, y: rect.top, items, vertical, grid, gridCols });
  }

  rows.sort((a, b) => a.y - b.y);
  return rows;
};

const focusEl = (el: HTMLElement | undefined, alignRowStart = false) => {
  if (!el) return;
  const isRTL = resolveIsRTL();

  el.focus({ preventScroll: false });

  if (alignRowStart) {
    el.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: isRTL ? 'end' : 'start',
    });
    return;
  }

  el.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'nearest',
  });
};

const isInSidebar = (el: HTMLElement): boolean => !!el.closest('[data-sidebar]');

export const useTVGlobalNavigation = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;

    let lastNav = 0;

    const handleKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (document.querySelector('[data-video-player="true"]')) return;

      const key = normalizeKey(e);
      if (!key) return;

      const tag = (e.target as HTMLElement)?.tagName;
      if ((tag === 'INPUT' || tag === 'TEXTAREA') && !['Enter', 'Back', 'ArrowUp', 'ArrowDown'].includes(key)) return;

      const active = document.activeElement as HTMLElement;
      const isRTL = resolveIsRTL();
      const towardSidebar = isRTL ? 'ArrowRight' : 'ArrowLeft';
      const towardContent = isRTL ? 'ArrowLeft' : 'ArrowRight';

      if (key === 'Enter') {
        if (active && active !== document.body) {
          e.preventDefault();
          active.click();
        }
        return;
      }

      if (key === 'Back') return;
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;

      const now = performance.now();
      if (now - lastNav < 70) {
        e.preventDefault();
        return;
      }
      lastNav = now;

      e.preventDefault();
      e.stopPropagation();

      const sidebarItems = getSidebarItems();
      const rows = getContentRows();

      if (!active || active === document.body || !active.classList.contains('tv-focus')) {
        focusEl(sidebarItems[0] || rows[0]?.items[0], true);
        return;
      }

      const goToSidebar = () => {
        if (sidebarItems.length === 0) return;
        const y = active.getBoundingClientRect().top + active.getBoundingClientRect().height / 2;
        let best = sidebarItems[0];
        let bestD = Infinity;

        for (const si of sidebarItems) {
          const d = Math.abs(si.getBoundingClientRect().top + si.getBoundingClientRect().height / 2 - y);
          if (d < bestD) {
            bestD = d;
            best = si;
          }
        }

        best.focus({ preventScroll: false });
      };

      const goToContent = () => {
        if (rows.length === 0) return;

        const activeY = active.getBoundingClientRect().top + active.getBoundingClientRect().height / 2;
        let best = rows[0];
        let bestDist = Infinity;

        for (const row of rows) {
          const d = Math.abs(row.y - activeY);
          if (d < bestDist) {
            bestDist = d;
            best = row;
          }
        }

        if (best.vertical) {
          focusEl(best.items[0], true);
        } else {
          const idx = isRTL ? best.items.length - 1 : 0;
          focusEl(best.items[idx], true);
        }
      };

      if (isInSidebar(active)) {
        const idx = sidebarItems.indexOf(active);

        if (key === 'ArrowUp' && idx > 0) {
          sidebarItems[idx - 1].focus({ preventScroll: false });
        } else if (key === 'ArrowDown' && idx < sidebarItems.length - 1) {
          sidebarItems[idx + 1].focus({ preventScroll: false });
        } else if (key === towardContent) {
          goToContent();
        }
        return;
      }

      let activeRowIdx = -1;
      let activeColIdx = -1;

      for (let r = 0; r < rows.length; r++) {
        const col = rows[r].items.indexOf(active);
        if (col !== -1) {
          activeRowIdx = r;
          activeColIdx = col;
          break;
        }
      }

      if (activeRowIdx === -1) {
        focusEl(rows[0]?.items[0] || sidebarItems[0], true);
        return;
      }

      const currentRow = rows[activeRowIdx];

      const goToPrevRow = () => {
        if (activeRowIdx > 0) {
          const prev = rows[activeRowIdx - 1];
          const idx = prev.vertical ? 0 : (isRTL ? prev.items.length - 1 : 0);
          focusEl(prev.items[idx], true);
        } else {
          // At the very top row — scroll page to top so hero is visible
          window.scrollTo({ top: 0, behavior: 'smooth' });
          // Try to focus the first focusable in the hero or sidebar
          const heroRow = rows.find(r => r.id === 'hero-actions');
          if (heroRow && heroRow.items.length > 0) {
            focusEl(heroRow.items[0], true);
          } else {
            goToSidebar();
          }
        }
      };

      const goToNextRow = () => {
        if (activeRowIdx < rows.length - 1) {
          const next = rows[activeRowIdx + 1];
          const idx = next.vertical ? 0 : (isRTL ? next.items.length - 1 : 0);
          focusEl(next.items[idx], true);
        }
      };

      if (currentRow.vertical) {
        if (key === 'ArrowUp') {
          if (activeColIdx > 0) focusEl(currentRow.items[activeColIdx - 1]);
          else goToPrevRow();
        } else if (key === 'ArrowDown') {
          if (activeColIdx < currentRow.items.length - 1) focusEl(currentRow.items[activeColIdx + 1]);
          else goToNextRow();
        } else if (key === towardSidebar) {
          goToSidebar();
        }
        return;
      }

      // ─── Grid navigation (e.g. episodes 2-col grid) ───
      if (currentRow.grid) {
        const cols = currentRow.gridCols;
        const gridRow = Math.floor(activeColIdx / cols);
        const gridCol = activeColIdx % cols;

        if (key === 'ArrowRight') {
          if (gridCol < cols - 1 && activeColIdx + 1 < currentRow.items.length) {
            focusEl(currentRow.items[activeColIdx + 1]);
          }
        } else if (key === 'ArrowLeft') {
          if (gridCol > 0) {
            focusEl(currentRow.items[activeColIdx - 1]);
          } else if (towardSidebar === 'ArrowLeft') {
            goToSidebar();
          }
        } else if (key === 'ArrowDown') {
          const nextIdx = activeColIdx + cols;
          if (nextIdx < currentRow.items.length) {
            focusEl(currentRow.items[nextIdx]);
          } else {
            goToNextRow();
          }
        } else if (key === 'ArrowUp') {
          const prevIdx = activeColIdx - cols;
          if (prevIdx >= 0) {
            focusEl(currentRow.items[prevIdx]);
          } else {
            goToPrevRow();
          }
        }
        return;
      }

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

    const t = setTimeout(() => {
      const a = document.activeElement;
      if (!a || a === document.body) {
        const rows = getContentRows();
        focusEl(rows[0]?.items[0] || getSidebarItems()[0], true);
      }
    }, 200);

    return () => {
      window.removeEventListener('keydown', handleKey, true);
      clearTimeout(t);
    };
  }, [enabled]);
};
