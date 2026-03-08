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

const getCenter = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
};

const getSpatialNext = (
  current: HTMLElement,
  focusable: HTMLElement[],
  direction: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
) => {
  const currentCenter = getCenter(current);
  const candidates = focusable
    .filter((el) => el !== current)
    .map((el) => ({ el, center: getCenter(el) }))
    .filter(({ center }) => {
      if (direction === 'ArrowRight') return center.x > currentCenter.x + 4;
      if (direction === 'ArrowLeft') return center.x < currentCenter.x - 4;
      if (direction === 'ArrowDown') return center.y > currentCenter.y + 4;
      return center.y < currentCenter.y - 4;
    })
    .map(({ el, center }) => {
      const dx = Math.abs(center.x - currentCenter.x);
      const dy = Math.abs(center.y - currentCenter.y);
      const primary = direction === 'ArrowLeft' || direction === 'ArrowRight' ? dx : dy;
      const secondary = direction === 'ArrowLeft' || direction === 'ArrowRight' ? dy : dx;
      return { el, score: primary * 10 + secondary };
    })
    .sort((a, b) => a.score - b.score);

  return candidates[0]?.el ?? null;
};

export const useTVGlobalNavigation = (enabled: boolean) => {
  const focusableSelector = useMemo(
    () => '.tv-focus, button, [role="button"], a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
    []
  );

  useEffect(() => {
    if (!enabled) return;

    const getFocusableWithin = (root: ParentNode | null) =>
      root
        ? Array.from(root.querySelectorAll<HTMLElement>(focusableSelector)).filter((el) => isHTMLElementVisible(el))
        : [];

    const getSidebarFocusable = () => getFocusableWithin(document.querySelector('[data-sidebar]'));
    const getMainFocusable = () => getFocusableWithin(document.querySelector('main'));
    const getAllFocusable = () => {
      const sidebar = getSidebarFocusable();
      const main = getMainFocusable();
      return [...sidebar, ...main.filter((el) => !sidebar.includes(el))];
    };

    let lastArrowAt = 0;

    const focusElement = (target: HTMLElement | null) => {
      if (!target) return;
      target.focus();

      const rect = target.getBoundingClientRect();
      const outsideViewport =
        rect.top < 0 ||
        rect.left < 0 ||
        rect.bottom > window.innerHeight ||
        rect.right > window.innerWidth;

      if (outsideViewport) {
        target.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
      }
    };

    const focusFirstAvailable = () => {
      const main = getMainFocusable();
      const sidebar = getSidebarFocusable();
      const all = getAllFocusable();
      focusElement(main[0] || sidebar[0] || all[0] || null);
    };

    const moveInList = (list: HTMLElement[], current: HTMLElement, delta: number) => {
      const idx = list.indexOf(current);
      if (idx === -1) {
        focusElement(list[0] || null);
        return;
      }
      const nextIdx = Math.min(Math.max(idx + delta, 0), list.length - 1);
      focusElement(list[nextIdx] || null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (document.querySelector('[data-video-player="true"]')) return;

      const key = normalizeRemoteKey(e);
      if (!key) return;

      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        const now = performance.now();
        if (now - lastArrowAt < 55) {
          e.preventDefault();
          return;
        }
        lastArrowAt = now;
      }

      const sidebarFocusable = getSidebarFocusable();
      const mainFocusable = getMainFocusable();
      const allFocusable = [...sidebarFocusable, ...mainFocusable.filter((el) => !sidebarFocusable.includes(el))];
      if (!allFocusable.length) return;

      const active = document.activeElement as HTMLElement | null;
      const isActiveFocusable = !!active && allFocusable.includes(active);
      const isRTL = (document.documentElement.getAttribute('dir') || document.body.getAttribute('dir') || 'ltr') === 'rtl';
      const towardContent = isRTL ? 'ArrowLeft' : 'ArrowRight';
      const towardSidebar = isRTL ? 'ArrowRight' : 'ArrowLeft';

      if (key === 'Home') {
        e.preventDefault();
        focusFirstAvailable();
        return;
      }

      if (key === 'Enter' || key === ' ') {
        if (active && active !== document.body) {
          e.preventDefault();
          active.click();
        } else {
          e.preventDefault();
          focusFirstAvailable();
        }
        return;
      }

      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;

      if (!isActiveFocusable) {
        e.preventDefault();
        focusFirstAvailable();
        return;
      }

      const activeEl = active as HTMLElement;
      const activeInSidebar = sidebarFocusable.includes(activeEl);

      if (activeInSidebar) {
        if (key === 'ArrowUp' || key === 'ArrowDown') {
          e.preventDefault();
          moveInList(sidebarFocusable, activeEl, key === 'ArrowDown' ? 1 : -1);
          return;
        }

        if (key === towardContent && mainFocusable.length) {
          e.preventDefault();
          const nextMain = getSpatialNext(activeEl, mainFocusable, key as 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight') || mainFocusable[0];
          focusElement(nextMain);
        }

        return;
      }

      const nextInMain = getSpatialNext(activeEl, mainFocusable, key as 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight');
      if (nextInMain) {
        e.preventDefault();
        focusElement(nextInMain);
        return;
      }

      if (key === towardSidebar && sidebarFocusable.length) {
        e.preventDefault();
        const nextSidebar = getSpatialNext(activeEl, sidebarFocusable, key as 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight') || sidebarFocusable[0];
        focusElement(nextSidebar);
        return;
      }

      const activeIndex = mainFocusable.indexOf(activeEl);
      if (activeIndex === -1) return;

      const moveForward = key === 'ArrowDown' || key === 'ArrowRight';
      const nextIndex = moveForward
        ? Math.min(activeIndex + 1, mainFocusable.length - 1)
        : Math.max(activeIndex - 1, 0);

      if (nextIndex !== activeIndex) {
        e.preventDefault();
        focusElement(mainFocusable[nextIndex]);
      }
    };

    const ensureInitialFocus = window.setTimeout(() => {
      const active = document.activeElement as HTMLElement | null;
      if (!active || active === document.body) {
        focusFirstAvailable();
      }
    }, 80);

    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.clearTimeout(ensureInitialFocus);
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, focusableSelector]);
};
