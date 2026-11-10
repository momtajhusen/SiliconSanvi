import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { scrollPageToTop } from '../../lib/scrollPageToTop';
import { mediaUrl } from '../../lib/api';

export function useMarketingShell() {
  const location = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('marketing', 'force-light');
    return () => {
      root.classList.remove('marketing', 'force-light');
      if (localStorage.getItem('silicon-theme') === 'dark') root.classList.add('dark');
    };
  }, []);

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      scrollPageToTop();
    }
  }, [location.pathname, location.hash]);
}

/** Sets the tab title and, when a favicon was uploaded in Company setup, the tab icon. */
export function useDocumentBrand(title, favicon) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    let link = document.querySelector("link[rel~='icon']");
    const previousHref = link?.getAttribute('href');
    if (favicon) {
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.setAttribute('href', mediaUrl(favicon));
    }
    return () => {
      document.title = previousTitle;
      if (favicon && link) {
        if (previousHref) link.setAttribute('href', previousHref);
        else link.remove();
      }
    };
  }, [title, favicon]);
}

export function useScrolled(offset = 12) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const root = document.getElementById('root');
    const onScroll = () => setScrolled(Math.max(window.scrollY, root?.scrollTop || 0) > offset);
    onScroll();
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => document.removeEventListener('scroll', onScroll, { capture: true });
  }, [offset]);
  return scrolled;
}

export function useSlideshow(count, interval = 6500) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = useCallback((target) => setIndex(((target % count) + count) % count), [count]);
  const next = useCallback(() => setIndex((current) => (current + 1) % count), [count]);
  const prev = useCallback(() => setIndex((current) => (current - 1 + count) % count), [count]);

  const regionProps = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onKeyDown: (event) => {
      if (event.key === 'ArrowRight') next();
      if (event.key === 'ArrowLeft') prev();
    },
  };

  const progressProps = () => ({
    style: { animationDuration: `${interval}ms`, animationPlayState: paused ? 'paused' : 'running' },
    onAnimationEnd: next,
  });

  return { index, paused, go, next, prev, regionProps, progressProps };
}
