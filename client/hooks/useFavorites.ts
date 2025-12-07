import { useState, useEffect } from "react";

interface FavoriteItem {
  label: string;
  path?: string;
}

const FAVORITES_STORAGE_KEY = "app_favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to parse favorites from localStorage:", error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    }
  }, [favorites, isLoaded]);

  const addFavorite = (item: FavoriteItem) => {
    setFavorites((prev) => {
      // Check if already exists
      const exists = prev.some((fav) => fav.label === item.label);
      if (exists) {
        return prev;
      }
      return [...prev, item];
    });
  };

  const removeFavorite = (label: string) => {
    setFavorites((prev) => prev.filter((fav) => fav.label !== label));
  };

  const isFavorite = (label: string) => {
    return favorites.some((fav) => fav.label === label);
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
  };
}
