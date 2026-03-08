import { useEffect, useMemo, useState } from 'react';

const TV_UA_REGEX = /Android TV|GoogleTV|SmartTV|SMART-TV|HbbTV|AFT|BRAVIA|TV/i;
const ANDROID_TV_HINT_REGEX = /AFT|BRAVIA|MIBOX|SHIELD|ADT-|SmartTV|GoogleTV/i;

const KEYCODE_MAP: Record<number, string> = {
  19: 'ArrowUp',
  20: 'ArrowDown',
  21: 'ArrowLeft',
  22: 'ArrowRight',
  23: 'Enter',
  66: 'Enter',
  3: 'Home',
  36: 'Home',
};

const normalizeRemoteKey = (e: KeyboardEvent): string => {
  const key = e.key || '';
  const code = e.code || '';
  const lowered = key.toLowerCase();

  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'enter', ' ', 'home'].includes(lowered)) {
    return key === ' ' ? ' ' : key;
  }

  if (lowered === 'select' || lowered === 'ok' || lowered === 'dpad_center') {
    return 'Enter';
  }

  if (lowered === 'dpad_up') return 'ArrowUp';
  if (lowered === 'dpad_down') return 'ArrowDown';
  if (lowered === 'dpad_left') return 'ArrowLeft';
  if (lowered === 'dpad_right') return 'ArrowRight';

  if (code === 'Space') return ' ';
  if (code.startsWith('Arrow')) return code;

  return KEYCODE_MAP[e.keyCode] || '';
};

export const detectTVDevice = () => {
  if (typeof window === 'undefined') return false;

  const ua = window.navigator.userAgent || '';
  const hasTVSignature = TV_UA_REGEX.test(ua);
  const isAndroidTVLike = ua.includes('Android') && ANDROID_TV_HINT_REGEX.test(ua);
  const forceTVMode = window.localStorage.getItem('force-tv-mode') === 'true';
  const capacitorRuntime = Boolean((window as any).Capacitor);

  return forceTVMode || hasTVSignature || isAndroidTVLike || capacitorRuntime;
};

export const useIsTVDevice = () => {
  const [isTV, setIsTV] = useState(false);

  useEffect(() => {
    setIsTV(detectTVDevice());
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
    !el.hasAttribute('disabled')
  );
};

const getCenter = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
};

const getSpatialNext = (current: HTMLElement, focusable: HTMLElement[], direction: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight') => {
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

    const isWithinViewport = (el: HTMLElement, overscan = 320) => {
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

    const getFocusable = () =>
      Array.from(document.querySelectorAll<HTMLElement>(focusableSelector)).filter((el) => {
        if (!isHTMLElementVisible(el)) return false;
        return isWithinViewport(el);
      });

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

    const focusAt = (index: number) => {
      const focusable = getFocusable();
      focusElement(focusable[index] || null);
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
        if (e.repeat || now - lastArrowAt < 110) {
          e.preventDefault();
          return;
        }
        lastArrowAt = now;
      }

      const focusable = getFocusable();
      if (!focusable.length) return;

      const active = document.activeElement as HTMLElement | null;
      const activeIndex = active ? focusable.indexOf(active) : -1;

      if (key === 'Home') {
        e.preventDefault();
        focusAt(0);
        return;
      }

      if (key === 'Enter' || key === ' ') {
        if (active && active !== document.body) {
          e.preventDefault();
          active.click();
        }
        return;
      }

      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;

      if (activeIndex === -1) {
        e.preventDefault();
        focusAt(0);
        return;
      }

      const current = focusable[activeIndex];
      const nextSpatial = getSpatialNext(current, focusable, key as 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight');

      if (nextSpatial) {
        e.preventDefault();
        focusElement(nextSpatial);
        return;
      }

      const moveForward = key === 'ArrowDown' || key === 'ArrowRight';
      const nextIndex = moveForward
        ? Math.min(activeIndex + 1, focusable.length - 1)
        : Math.max(activeIndex - 1, 0);

      if (nextIndex !== activeIndex) {
        e.preventDefault();
        focusAt(nextIndex);
      }
    };

    const ensureInitialFocus = window.setTimeout(() => {
      const active = document.activeElement as HTMLElement | null;
      if (!active || active === document.body) {
        focusAt(0);
      }
    }, 120);

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(ensureInitialFocus);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, focusableSelector]);
};
