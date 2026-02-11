import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

// Типизация объекта Аниме (API Response)
interface Anime {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      image_url: string;
    };
  };
  score: number;
}

// Типизация объекта Жанр
interface Genre {
  mal_id: number;
  name: string;
  count: number;
}

function App() {
  // Управление состоянием приложения
  const [query, setQuery] = useState("");
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);

  // Ref для элемента-триггера (Infinite Scroll)
  const observerTarget = useRef(null);

  // Инициализация: получение и сортировка списка жанров
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch("https://api.jikan.moe/v4/genres/anime");
        const data = await response.json();

        // Сортировка жанров в алфавитном порядке
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

  // Основной метод запроса данных к API
  const fetchAnime = useCallback(
    async (pageNum: number, isNewSearch: boolean) => {
      // Блокировка повторных запросов в процессе загрузки
      if (isLoading) return;

      setIsLoading(true);
      try {
        // Формирование URL с параметрами фильтрации
        let url = `https://api.jikan.moe/v4/anime?limit=24&page=${pageNum}&order_by=popularity`;

        if (query) url += `&q=${query}`;
        if (selectedGenre) url += `&genres=${selectedGenre}`;

        const response = await fetch(url);
        const data = await response.json();

        // Проверка наличия следующей страницы для пагинации
        setHasNextPage(data.pagination?.has_next_page ?? false);

        // Обновление списка: полная замена или добавление новых элементов
        if (isNewSearch) {
          setAnimeList(data.data || []);
        } else {
          setAnimeList((prev) => {
            if (!data.data) return prev;
            // Фильтрация дубликатов по ID
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
    // Зависимости: обновление функции при изменении фильтров
    [query, selectedGenre],
  );

  // Эффект: Сброс пагинации при изменении жанра
  useEffect(() => {
    setPage(1);
    setHasNextPage(true);
    fetchAnime(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGenre]);

  // Обработчик отправки формы поиска
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setHasNextPage(true);
    fetchAnime(1, true);
  };

  // Реализация бесконечной прокрутки (Intersection Observer)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        // Триггер загрузки следующей страницы при видимости элемента
        if (
          target.isIntersecting &&
          !isLoading &&
          hasNextPage &&
          animeList.length > 0
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

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [isLoading, hasNextPage, animeList, fetchAnime]);

  return (
    <div className="container">
      <h1>Anime Search 🔎</h1>

      {/* Панель фильтрации и поиска */}
      <form onSubmit={handleSearch} className="search-box">
        <input
          type="text"
          placeholder="Поиск..."
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
              {genre.name} ({genre.count})
            </option>
          ))}
        </select>

        <button type="submit">Найти</button>
      </form>

      {/* Сетка результатов */}
      <div className="anime-grid">
        {animeList.map((anime) => (
          <div key={anime.mal_id} className="anime-card">
            <img src={anime.images.jpg.image_url} alt={anime.title} />
            <h3>{anime.title}</h3>
            {anime.score && <span className="score">★ {anime.score}</span>}
          </div>
        ))}
      </div>

      {/* Элемент-триггер для подгрузки данных */}
      <div ref={observerTarget} className="loading-trigger">
        {isLoading && <p style={{ color: "white" }}>Загрузка...</p>}
        {!isLoading && !hasNextPage && animeList.length > 0 && (
          <p style={{ color: "gray" }}>Список завершен</p>
        )}
      </div>
    </div>
  );
}

export default App;
