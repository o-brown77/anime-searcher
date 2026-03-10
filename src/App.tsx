import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";
import type { Anime, Genre } from "./types";
import { useFavoriteStore } from "./store/useFavoriteStore";

/**
 * Главный компонент приложения для поиска аниме.
 * Управляет состоянием поиска, фильтрацией по жанрам и списком избранного.
 * Реализует бесконечную прокрутку (Infinite Scroll) с помощью Intersection Observer.
 *
 * @returns {JSX.Element} Основной пользовательский интерфейс.
 */

function App() {
  const [query, setQuery] = useState("");
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);

  // Новые состояния
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);

  const observerTarget = useRef(null);

  // Zustand Store
  const { favorites, toggleFavorite, isFavorite } = useFavoriteStore();

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch("https://api.jikan.moe/v4/genres/anime");
        const data = await response.json();
        const sortedGenres = data.data.sort((a: Genre, b: Genre) =>
          a.name.localeCompare(b.name),
        );
        setGenres(sortedGenres);
      } catch (error) {
        console.error("Ошибка инициализации жанров:", error);
      }
    };
    fetchGenres();
  }, []);

  const fetchAnime = useCallback(
    async (pageNum: number, isNewSearch: boolean) => {
      if (isLoading || showFavorites) return; // Не загружаем API, если смотрим избранное

      setIsLoading(true);
      try {
        let url = `https://api.jikan.moe/v4/anime?limit=24&page=${pageNum}&order_by=popularity`;
        if (query) url += `&q=${encodeURIComponent(query)}`;
        if (selectedGenre) url += `&genres=${selectedGenre}`;

        const response = await fetch(url);
        const data = await response.json();

        setHasNextPage(data.pagination?.has_next_page ?? false);

        if (isNewSearch) {
          setAnimeList(data.data || []);
        } else {
          setAnimeList((prev) => {
            if (!data.data) return prev;
            const newAnime = data.data.filter(
              (newItem: Anime) =>
                !prev.some((prevItem) => prevItem.mal_id === newItem.mal_id),
            );
            return [...prev, ...newAnime];
          });
        }
      } catch (error) {
        console.error("Ошибка при запросе данных:", error);
        setHasNextPage(false);
      } finally {
        setIsLoading(false);
      }
    },
    [query, selectedGenre, isLoading, showFavorites],
  );

  useEffect(() => {
    if (!showFavorites) {
      setPage(1);
      setHasNextPage(true);
      fetchAnime(1, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGenre, showFavorites]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (showFavorites) setShowFavorites(false);
    setPage(1);
    setHasNextPage(true);
    fetchAnime(1, true);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (
          target.isIntersecting &&
          !isLoading &&
          hasNextPage &&
          animeList.length > 0 &&
          !showFavorites
        ) {
          setPage((prevPage) => {
            const nextPage = prevPage + 1;
            fetchAnime(nextPage, false);
            return nextPage;
          });
        }
      },
      { threshold: 1.0 },
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [isLoading, hasNextPage, animeList.length, fetchAnime, showFavorites]);

  // Данные для рендера (либо Избранное, либо результаты API)
  const displayList = showFavorites ? favorites : animeList;

  return (
    <div className="container">
      <div className="header-actions">
        <h1>Anime Search 🔎</h1>
        <button
          className="toggle-fav-btn"
          onClick={() => setShowFavorites(!showFavorites)}
        >
          {showFavorites
            ? "Показать поиск"
            : `❤️ Избранное (${favorites.length})`}
        </button>
      </div>

      {!showFavorites && (
        <form onSubmit={handleSearch} className="search-box">
          <input
            type="text"
            placeholder="Поиск аниме..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="genre-select"
          >
            <option value="">Все жанры</option>
            {genres.map((genre) => (
              <option key={genre.mal_id} value={genre.mal_id}>
                {genre.name}
              </option>
            ))}
          </select>
          <button type="submit">Найти</button>
        </form>
      )}

      {showFavorites && favorites.length === 0 && (
        <p style={{ textAlign: "center", marginTop: "2rem" }}>
          У вас пока нет избранных аниме.
        </p>
      )}

      <div className="anime-grid">
        {/* Рендер карточек */}
        {displayList.map((anime) => (
          <div
            key={anime.mal_id}
            className="anime-card"
            style={{ position: "relative", cursor: "pointer" }}
            onClick={() => setSelectedAnime(anime)}
          >
            <img
              src={anime.images.jpg.image_url}
              alt={anime.title}
              loading="lazy"
            />
            <h3>{anime.title}</h3>
            {anime.score && <span className="score">★ {anime.score}</span>}

            {/* Кнопка лайка поверх карточки */}
            <button
              className="favorite-btn"
              onClick={(e) => {
                e.stopPropagation(); // Чтобы не открывалась модалка при клике на лайк
                toggleFavorite(anime);
              }}
            >
              {isFavorite(anime.mal_id) ? "❤️" : "🤍"}
            </button>
          </div>
        ))}

        {/* SKELETON SCREEN (показываем только во время загрузки) */}
        {isLoading &&
          !showFavorites &&
          Array.from({ length: 8 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="skeleton-card"></div>
          ))}
      </div>

      {!showFavorites && (
        <div ref={observerTarget} className="loading-trigger">
          {!isLoading && !hasNextPage && animeList.length > 0 && (
            <p style={{ color: "gray" }}>Вы просмотрели весь список</p>
          )}
        </div>
      )}

      {/* MODAL WINDOW */}
      {selectedAnime && (
        <div className="modal-overlay" onClick={() => setSelectedAnime(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-modal-btn"
              onClick={() => setSelectedAnime(null)}
            >
              ×
            </button>
            <img
              src={
                selectedAnime.images.jpg.large_image_url ||
                selectedAnime.images.jpg.image_url
              }
              alt={selectedAnime.title}
            />
            <div className="modal-info">
              <h2>{selectedAnime.title}</h2>
              <p>
                <strong>Рейтинг:</strong> ★ {selectedAnime.score || "N/A"}
              </p>
              <p>
                <strong>Год:</strong> {selectedAnime.year || "Неизвестно"}
              </p>
              <p>
                <strong>Эпизоды:</strong>{" "}
                {selectedAnime.episodes || "Неизвестно"}
              </p>
              <p>
                <strong>Статус:</strong> {selectedAnime.status || "Неизвестно"}
              </p>
              <p>
                <strong>Описание:</strong>{" "}
                {selectedAnime.synopsis || "Описание отсутствует."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
