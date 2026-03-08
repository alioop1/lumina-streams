import { useEffect, useMemo, useState } from 'react';

const TV_UA_REGEX = /Android TV|GoogleTV|SmartTV|SMART-TV|HbbTV|AFT|BRAVIA|TV/i;
const ANDROID_TV_HINT_REGEX = /AFT|BRAVIA|MIBOX|SHIELD|ADT-|SmartTV|GoogleTV/i;

const KEYCODE_MAP: Record<number, string> = {
  13: 'Enter',
  19: 'ArrowUp',
  20: 'ArrowDown',
  21: 'ArrowLeft',
  22: 'ArrowRight',
  23: 'Enter',
  32: ' ',
  37: 'ArrowLeft',
  38: 'ArrowUp',
  39: 'ArrowRight',
  40: 'ArrowDown',
  66: 'Enter',
  3: 'Home',
  36: 'Home',
};

const normalizeRemoteKey = (e: KeyboardEvent): string => {
  const lowered = (e.key || '').toLowerCase();

  if (lowered === 'arrowup' || lowered === 'up' || lowered === 'dpad_up' || lowered === 'dpadup') return 'ArrowUp';
  if (lowered === 'arrowdown' || lowered === 'down' || lowered === 'dpad_down' || lowered === 'dpaddown') return 'ArrowDown';
  if (lowered === 'arrowleft' || lowered === 'left' || lowered === 'dpad_left' || lowered === 'dpadleft') return 'ArrowLeft';
  if (lowered === 'arrowright' || lowered === 'right' || lowered === 'dpad_right' || lowered === 'dpadright') return 'ArrowRight';
  if (lowered === 'enter' || lowered === 'select' || lowered === 'ok' || lowered === 'center' || lowered === 'dpad_center') return 'Enter';
  if (lowered === 'home') return 'Home';
  if (lowered === ' ') return ' ';

  if (e.code === 'Space') return ' ';
  if (e.code && e.code.startsWith('Arrow')) return e.code;

  const keyCode = e.keyCode || (e as any).which || 0;
  return KEYCODE_MAP[keyCode] || '';
};

export const detectTVDevice = () => {
  if (typeof window === 'undefined') return false;

  const ua = window.navigator.userAgent || '';
  const hasTVSignature = TV_UA_REGEX.test(ua);
  const isAndroidTVLike = ua.includes('Android') && ANDROID_TV_HINT_REGEX.test(ua);
  const forceTVMode = window.localStorage.getItem('force-tv-mode') === 'true';
  const queryForceTV = new URLSearchParams(window.location.search).get('tv') === '1';
  const capacitorRuntime = Boolean((window as any).Capacitor);

  return forceTVMode || queryForceTV || hasTVSignature || isAndroidTVLike || capacitorRuntime;
};

export const useIsTVDevice = () => {
  const [isTV, setIsTV] = useState(() => detectTVDevice());

  useEffect(() => {
    const detectFromRemoteInput = (e: KeyboardEvent) => {
      const normalized = normalizeRemoteKey(e);
      const keyCode = e.keyCode || (e as any).which || 0;
      const looksLikeRemoteKey =
        !!normalized ||
        keyCode in KEYCODE_MAP ||
        e.key === 'Unidentified' ||
        e.code?.startsWith('Arrow') ||
        e.code === 'NumpadEnter';

      if (!looksLikeRemoteKey) return;

      window.localStorage.setItem('force-tv-mode', 'true');
      setIsTV(true);
    };

    window.addEventListener('keydown', detectFromRemoteInput, true);

    return () => {
      window.removeEventListener('keydown', detectFromRemoteInput, true);
    };
  }, []);

  return isTV;
};

const isHTMLElementVisible = (el: HTMLElement) => {
  const style = window.getComputedStyle(el);
  const hasNoOpacity = Number(style.opacity) <= 0.01;
  const hiddenByAria = el.getAttribute('aria-hidden') === 'true' || !!el.closest('[aria-hidden="true"]');

  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.pointerEvents !== 'none' &&
    !hasNoOpacity &&
    !hiddenByAria &&
    !el.hasAttribute('disabled') &&
    el.getClientRects().length > 0
  );
};

export const useTVGlobalNavigation = (enabled: boolean) => {
  useEffect(() => {
    const focusableSelector = '.tv-focus';
    if (!enabled) return;

    const getSidebarRoot = () => document.querySelector('[data-sidebar]');
    const getMainRoot = () => document.querySelector('main');

    const isWithinViewport = (el: HTMLElement, overscan = 180) => {
      const rect = el.getBoundingClientRect();
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom >= -overscan &&
        rect.top <= window.innerHeight + overscan &&
        rect.right >= -overscan &&
        rect.left <= window.innerWidth + overscan
      );
    };

    const getFocusableWithin = (root: ParentNode | null) =>
      root
        ? Array.from(root.querySelectorAll<HTMLElement>(focusableSelector)).filter(
            (el) => isHTMLElementVisible(el) && isWithinViewport(el)
          )
        : [];

    const getSidebarFocusable = () => getFocusableWithin(getSidebarRoot());
    const getMainFocusable = () => getFocusableWithin(getMainRoot());

    const getCenterPoint = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        rect,
      };
    };

    const focusElement = (target: HTMLElement | null) => {
      if (!target) return;
      target.focus();
      target.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
    };

    const focusNearestByY = (from: HTMLElement, targets: HTMLElement[]) => {
      if (!targets.length) return;
      const fromY = getCenterPoint(from).y;
      const nearest = [...targets].sort(
        (a, b) => Math.abs(getCenterPoint(a).y - fromY) - Math.abs(getCenterPoint(b).y - fromY)
      )[0];
      focusElement(nearest || null);
    };

    const getNextDirectionalInMain = (
      current: HTMLElement,
      list: HTMLElement[],
      direction: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
    ) => {
      const c = getCenterPoint(current);
      const axisLimitX = Math.max(c.rect.width * 1.9, 260);
      const axisLimitY = Math.max(c.rect.height * 2.0, 170);

      const candidates = list
        .filter((el) => el !== current)
        .map((el) => ({ el, point: getCenterPoint(el) }))
        .filter(({ point }) => {
          const dx = point.x - c.x;
          const dy = point.y - c.y;

          if (direction === 'ArrowRight') return dx > 4 && Math.abs(dy) <= axisLimitY;
          if (direction === 'ArrowLeft') return dx < -4 && Math.abs(dy) <= axisLimitY;
          if (direction === 'ArrowDown') return dy > 4 && Math.abs(dx) <= axisLimitX;
          return dy < -4 && Math.abs(dx) <= axisLimitX;
        })
        .map(({ el, point }) => {
          const dx = Math.abs(point.x - c.x);
          const dy = Math.abs(point.y - c.y);
          const primary = direction === 'ArrowLeft' || direction === 'ArrowRight' ? dx : dy;
          const secondary = direction === 'ArrowLeft' || direction === 'ArrowRight' ? dy : dx;
          return { el, score: primary + secondary * 0.42 };
        })
        .sort((a, b) => a.score - b.score);

      return candidates[0]?.el ?? null;
    };

    let lastArrowAt = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (document.querySelector('[data-video-player="true"]')) return;

      const key = normalizeRemoteKey(e);
      if (!key) return;

      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const sidebarFocusable = getSidebarFocusable();
      const mainFocusable = getMainFocusable();
      const allFocusable = [...sidebarFocusable, ...mainFocusable.filter((el) => !sidebarFocusable.includes(el))];
      if (!allFocusable.length) return;

      const active = document.activeElement as HTMLElement | null;
      const activeEl = active && allFocusable.includes(active) ? active : null;
      const isRTL = (document.documentElement.getAttribute('dir') || document.body.getAttribute('dir') || 'ltr') === 'rtl';
      const towardContent = isRTL ? 'ArrowLeft' : 'ArrowRight';
      const towardSidebar = isRTL ? 'ArrowRight' : 'ArrowLeft';

      if (key === 'Home') {
        e.preventDefault();
        focusElement(mainFocusable[0] || sidebarFocusable[0] || allFocusable[0] || null);
        return;
      }

      if (key === 'Enter' || key === ' ') {
        e.preventDefault();
        if (activeEl) {
          activeEl.click();
        } else {
          focusElement(mainFocusable[0] || sidebarFocusable[0] || allFocusable[0] || null);
        }
        return;
      }

      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;

      const now = performance.now();
      if (e.repeat || now - lastArrowAt < 110) {
        e.preventDefault();
        return;
      }
      lastArrowAt = now;

      if (!activeEl) {
        e.preventDefault();
        focusElement(mainFocusable[0] || sidebarFocusable[0] || allFocusable[0] || null);
        return;
      }

      const activeInSidebar = sidebarFocusable.includes(activeEl);

      if (activeInSidebar) {
        if (key === 'ArrowUp' || key === 'ArrowDown') {
          const idx = sidebarFocusable.indexOf(activeEl);
          const nextIdx = key === 'ArrowDown'
            ? Math.min(idx + 1, sidebarFocusable.length - 1)
            : Math.max(idx - 1, 0);
          e.preventDefault();
          focusElement(sidebarFocusable[nextIdx] || null);
          return;
        }

        if (key === towardContent && mainFocusable.length) {
          e.preventDefault();
          focusNearestByY(activeEl, mainFocusable);
        }
        return;
      }

      const nextInMain = getNextDirectionalInMain(activeEl, mainFocusable, key as 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight');
      if (nextInMain) {
        e.preventDefault();
        focusElement(nextInMain);
        return;
      }

      if (key === towardSidebar && sidebarFocusable.length) {
        e.preventDefault();
        focusNearestByY(activeEl, sidebarFocusable);
        return;
      }

      if (key === 'ArrowUp' || key === 'ArrowDown') {
        const idx = mainFocusable.indexOf(activeEl);
        if (idx !== -1) {
          const nextIdx = key === 'ArrowDown'
            ? Math.min(idx + 1, mainFocusable.length - 1)
            : Math.max(idx - 1, 0);
          if (nextIdx !== idx) {
            e.preventDefault();
            focusElement(mainFocusable[nextIdx] || null);
          }
        }
      }
    };

    const ensureInitialFocus = window.setTimeout(() => {
      const active = document.activeElement as HTMLElement | null;
      if (!active || active === document.body) {
        focusElement(getMainFocusable()[0] || getSidebarFocusable()[0] || null);
      }
    }, 60);

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.clearTimeout(ensureInitialFocus);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, focusableSelector]);
};
