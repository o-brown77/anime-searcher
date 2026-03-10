import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Anime } from "../types";

/**
 * Интерфейс глобального состояния для списка "Избранного".
 *
 * @property {Anime[]} favorites - Массив объектов аниме, добавленных в избранное.
 * @property {function} toggleFavorite - Метод для добавления или удаления аниме из списка.
 * @property {function} isFavorite - Метод для проверки наличия аниме в списке по ID.
 */
interface FavoriteState {
  favorites: Anime[];
  toggleFavorite: (anime: Anime) => void;
  isFavorite: (id: number) => boolean;
}

/**
 * Глобальное хранилище для работы с избранными аниме.
 * Использует middleware persist для автоматической синхронизации состояния с localStorage.
 */
export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      favorites: [],

      toggleFavorite: (anime) =>
        set((state) => {
          const exists = state.favorites.some((a) => a.mal_id === anime.mal_id);
          if (exists) {
            return {
              favorites: state.favorites.filter(
                (a) => a.mal_id !== anime.mal_id,
              ),
            };
          }
          return { favorites: [...state.favorites, anime] };
        }),

      isFavorite: (id) => get().favorites.some((a) => a.mal_id === id),
    }),
    {
      name: "anime-favorites-storage", // Ключ в localStorage
    },
  ),
);
