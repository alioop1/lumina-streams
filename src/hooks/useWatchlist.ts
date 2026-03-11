import { useState, useCallback, useEffect } from 'react';
import { Movie } from '@/lib/mockData';

const STORAGE_KEY = 'watchlist';
const HISTORY_KEY = 'watch-history';
const PROGRESS_KEY = 'watch-progress';

export interface WatchlistItem extends Movie {
  addedAt: number;
}

export interface HistoryItem extends Movie {
  watchedAt: number;
}

export interface WatchProgress {
  [imdbOrId: string]: {
    position: number;
    duration: number;
    updatedAt: number;
    title?: string;
    poster?: string;
  };
}

const loadItems = <T,>(key: string): T[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
};

const saveItems = <T,>(key: string, items: T[]) => {
  localStorage.setItem(key, JSON.stringify(items));
};

export const useWatchlist = () => {
  const [items, setItems] = useState<WatchlistItem[]>(() => loadItems(STORAGE_KEY));

  const add = useCallback((movie: Movie) => {
    setItems(prev => {
      if (prev.some(i => i.id === movie.id)) return prev;
      const next = [{ ...movie, addedAt: Date.now() }, ...prev];
      saveItems(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const remove = useCallback((movieId: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== movieId);
      saveItems(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const toggle = useCallback((movie: Movie) => {
    setItems(prev => {
      const exists = prev.some(i => i.id === movie.id);
      const next = exists
        ? prev.filter(i => i.id !== movie.id)
        : [{ ...movie, addedAt: Date.now() }, ...prev];
      saveItems(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const isInList = useCallback((movieId: string) => {
    return items.some(i => i.id === movieId);
  }, [items]);

  return { items, add, remove, toggle, isInList, count: items.length };
};

export const useWatchHistory = () => {
  const [items, setItems] = useState<HistoryItem[]>(() => loadItems(HISTORY_KEY));

  const addToHistory = useCallback((movie: Movie) => {
    setItems(prev => {
      const filtered = prev.filter(i => i.id !== movie.id);
      const next = [{ ...movie, watchedAt: Date.now() }, ...filtered].slice(0, 50);
      saveItems(HISTORY_KEY, next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setItems([]);
    saveItems(HISTORY_KEY, []);
  }, []);

  return { items, addToHistory, clearHistory };
};

export const useWatchProgress = () => {
  const [progress, setProgress] = useState<WatchProgress>(() => {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    } catch {
      return {};
    }
  });

  const updateProgress = useCallback((id: string, position: number, duration: number, title?: string, poster?: string) => {
    setProgress(prev => {
      const next = {
        ...prev,
        [id]: { position, duration, updatedAt: Date.now(), title, poster },
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getProgress = useCallback((id: string) => {
    return progress[id] || null;
  }, [progress]);

  const removeProgress = useCallback((id: string) => {
    setProgress(prev => {
      const next = { ...prev };
      delete next[id];
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { progress, updateProgress, getProgress, removeProgress };
};
