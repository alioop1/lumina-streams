import { useEffect, useState, useCallback } from 'react';

// ── TV device detection ──

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

// ── Key normalisation ──

const KEYCODE_MAP: Record<number, string> = {
  13: 'Enter', 19: 'ArrowUp', 20: 'ArrowDown', 21: 'ArrowLeft',
  22: 'ArrowRight', 23: 'Enter', 32: ' ', 37: 'ArrowLeft',
  38: 'ArrowUp', 39: 'ArrowRight', 40: 'ArrowDown', 66: 'Enter',
};

const normalizeKey = (e: KeyboardEvent): string => {
  const k = (e.key || '').toLowerCase();
  if (k === 'arrowup' || k === 'up' || k === 'dpadup') return 'ArrowUp';
  if (k === 'arrowdown' || k === 'down' || k === 'dpaddown') return 'ArrowDown';
  if (k === 'arrowleft' || k === 'left' || k === 'dpadleft') return 'ArrowLeft';
  if (k === 'arrowright' || k === 'right' || k === 'dpadright') return 'ArrowRight';
  if (k === 'enter' || k === 'select' || k === 'ok' || k === 'center') return 'Enter';
  if (k === ' ') return ' ';
  if (k === 'escape' || k === 'backspace' || k === 'goback') return 'Back';
  if (e.code?.startsWith('Arrow')) return e.code;
  return KEYCODE_MAP[e.keyCode || 0] || '';
};

// ── Row-based spatial navigation ──

const FOCUSABLE = '.tv-focus';
const ROW_THRESHOLD = 30; // px – elements within this Y-gap are considered same row

interface FocusableInfo {
  el: HTMLElement;
  cx: number;
  cy: number;
}

const getVisible = (): FocusableInfo[] => {
  const els = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE));
  const result: FocusableInfo[] = [];
  for (const el of els) {
    if (el.offsetParent === null) continue;
    if (el.hasAttribute('disabled')) continue;
    if (el.getAttribute('aria-hidden') === 'true') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    // Only include elements roughly in/near viewport
    if (r.bottom < -100 || r.top > window.innerHeight + 100) continue;
    if (r.right < -100 || r.left > window.innerWidth + 100) continue;
    result.push({ el, cx: r.left + r.width / 2, cy: r.top + r.height / 2 });
  }
  return result;
};

const clusterRows = (items: FocusableInfo[]): FocusableInfo[][] => {
  if (!items.length) return [];
  const sorted = [...items].sort((a, b) => a.cy - b.cy || a.cx - b.cx);
  const rows: FocusableInfo[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const last = rows[rows.length - 1];
    const avgY = last.reduce((s, it) => s + it.cy, 0) / last.length;
    if (Math.abs(sorted[i].cy - avgY) <= ROW_THRESHOLD) {
      last.push(sorted[i]);
    } else {
      rows.push([sorted[i]]);
    }
  }
  // Sort each row by X
  for (const row of rows) {
    row.sort((a, b) => a.cx - b.cx);
  }
  return rows;
};

const findInRows = (rows: FocusableInfo[][], el: HTMLElement): [number, number] => {
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      if (rows[r][c].el === el) return [r, c];
    }
  }
  return [-1, -1];
};

export const useTVGlobalNavigation = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;

    let lastNav = 0;
    const THROTTLE = 100; // ms between arrow navigations

    const focusEl = (el: HTMLElement | null | undefined) => {
      if (!el) return;
      el.focus({ preventScroll: false });
      el.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
    };

    const handleKey = (e: KeyboardEvent) => {
      // Don't interfere with video player
      if (document.querySelector('[data-video-player="true"]')) return;
      if (e.defaultPrevented) return;

      const key = normalizeKey(e);
      if (!key) return;

      // Don't intercept input fields for arrow keys
      const tag = (e.target as HTMLElement)?.tagName;
      if ((tag === 'INPUT' || tag === 'TEXTAREA') && key !== 'Back') return;

      const isRTL = document.documentElement.dir === 'rtl' || document.body.dir === 'rtl';

      // Enter / Space → click focused element
      if (key === 'Enter' || key === ' ') {
        const active = document.activeElement as HTMLElement;
        if (active && active !== document.body) {
          e.preventDefault();
          e.stopPropagation();
          active.click();
        }
        return;
      }

      // Back → do nothing here (let pages handle it)
      if (key === 'Back') return;

      // Arrow keys
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

      const items = getVisible();
      if (!items.length) return;

      const rows = clusterRows(items);
      const active = document.activeElement as HTMLElement;

      // If nothing focused, focus first element
      if (!active || active === document.body) {
        focusEl(rows[0]?.[0]?.el);
        return;
      }

      const [row, col] = findInRows(rows, active);

      // If active element not found in grid, focus first element
      if (row === -1) {
        focusEl(rows[0]?.[0]?.el);
        return;
      }

      // Determine effective direction (flip horizontal for RTL)
      let dir = key;
      if (isRTL) {
        if (key === 'ArrowLeft') dir = 'ArrowRight';
        else if (key === 'ArrowRight') dir = 'ArrowLeft';
      }

      switch (dir) {
        case 'ArrowRight': {
          const nextCol = col + 1;
          if (nextCol < rows[row].length) {
            focusEl(rows[row][nextCol].el);
          }
          // At end of row → do nothing (don't wrap)
          break;
        }
        case 'ArrowLeft': {
          const prevCol = col - 1;
          if (prevCol >= 0) {
            focusEl(rows[row][prevCol].el);
          }
          // At start of row → do nothing
          break;
        }
        case 'ArrowDown': {
          const nextRow = row + 1;
          if (nextRow < rows.length) {
            // Find closest X in next row
            const curX = rows[row][col].cx;
            let best = rows[nextRow][0];
            let bestDist = Math.abs(best.cx - curX);
            for (let i = 1; i < rows[nextRow].length; i++) {
              const d = Math.abs(rows[nextRow][i].cx - curX);
              if (d < bestDist) { best = rows[nextRow][i]; bestDist = d; }
            }
            focusEl(best.el);
          }
          break;
        }
        case 'ArrowUp': {
          const prevRow = row - 1;
          if (prevRow >= 0) {
            const curX = rows[row][col].cx;
            let best = rows[prevRow][0];
            let bestDist = Math.abs(best.cx - curX);
            for (let i = 1; i < rows[prevRow].length; i++) {
              const d = Math.abs(rows[prevRow][i].cx - curX);
              if (d < bestDist) { best = rows[prevRow][i]; bestDist = d; }
            }
            focusEl(best.el);
          }
          break;
        }
      }
    };

    // Single listener, capture phase
    window.addEventListener('keydown', handleKey, true);

    // Auto-focus first element on mount
    const t = setTimeout(() => {
      const a = document.activeElement;
      if (!a || a === document.body) {
        const items = getVisible();
        if (items.length) {
          const rows = clusterRows(items);
          focusEl(rows[0]?.[0]?.el);
        }
      }
    }, 100);

    return () => {
      window.removeEventListener('keydown', handleKey, true);
      clearTimeout(t);
    };
  }, [enabled]);
};
