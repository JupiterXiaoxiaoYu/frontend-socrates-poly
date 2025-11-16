import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface FavoritesContextType {
  favorites: Set<string>;
  toggleFavorite: (marketId: string) => void;
  isFavorite: (marketId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FAVORITES_STORAGE_KEY = "socrates_favorite_markets";

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // 从 localStorage 加载收藏
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const favArray = JSON.parse(stored);
        setFavorites(new Set(favArray));
      }
    } catch (error) {
      console.error("Failed to load favorites:", error);
    }
  }, []);

  // 保存到 localStorage
  const saveFavorites = (newFavorites: Set<string>) => {
    try {
      const favArray = Array.from(newFavorites);
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favArray));
    } catch (error) {
      console.error("Failed to save favorites:", error);
    }
  };

  // 切换收藏状态
  const toggleFavorite = (marketId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(marketId)) {
        newFavorites.delete(marketId);
      } else {
        newFavorites.add(marketId);
      }
      saveFavorites(newFavorites);
      return newFavorites;
    });
  };

  // 检查是否已收藏
  const isFavorite = (marketId: string) => {
    return favorites.has(marketId);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};

