import { useEffect, useMemo, useState } from 'react';

const TV_UA_REGEX = /Android TV|GoogleTV|SmartTV|SMART-TV|HbbTV|AFT|BRAVIA|TV/i;
const ANDROID_TV_HINT_REGEX = /AFT|BRAVIA|MIBOX|SHIELD|ADT-|SmartTV|GoogleTV/i;

export const detectTVDevice = () => {
  if (typeof window === 'undefined') return false;

  const ua = window.navigator.userAgent || '';
  const hasTVSignature = TV_UA_REGEX.test(ua);
  const isAndroidTVLike = ua.includes('Android') && ANDROID_TV_HINT_REGEX.test(ua);

  return hasTVSignature || isAndroidTVLike;
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
  return style.display !== 'none' && style.visibility !== 'hidden' && !el.hasAttribute('disabled');
};

export const useTVGlobalNavigation = (enabled: boolean) => {
  const focusableSelector = useMemo(
    () => '.tv-focus, button, [role="button"], a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
    []
  );

  useEffect(() => {
    if (!enabled) return;

    const getFocusable = () =>
      Array.from(document.querySelectorAll<HTMLElement>(focusableSelector)).filter((el) => {
        if (!isHTMLElementVisible(el)) return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

    const focusAt = (index: number) => {
      const focusable = getFocusable();
      const target = focusable[index];
      if (!target) return;
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (document.querySelector('[data-video-player="true"]')) return;
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home'].includes(e.key)) return;

      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const focusable = getFocusable();
      if (!focusable.length) return;

      const active = document.activeElement as HTMLElement | null;
      const activeIndex = active ? focusable.indexOf(active) : -1;

      if (e.key === 'Home') {
        e.preventDefault();
        focusAt(0);
        return;
      }

      const moveForward = e.key === 'ArrowDown' || e.key === 'ArrowRight';
      const nextIndex =
        activeIndex === -1 ? 0 : moveForward ? Math.min(activeIndex + 1, focusable.length - 1) : Math.max(activeIndex - 1, 0);

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
    }, 150);

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(ensureInitialFocus);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, focusableSelector]);
};
