/**
 * Модель данных аниме, получаемая из Jikan API.
 *
 * @property {number} mal_id - Уникальный идентификатор аниме.
 * @property {string} title - Название аниме.
 * @property {object} images - Объект с ссылками на изображения.
 * @property {number} score - Пользовательский рейтинг.
 * @property {string} [synopsis] - Описание сюжета.
 * @property {number} [episodes] - Количество эпизодов.
 * @property {string} [status] - Статус выхода (например, "Finished Airing").
 * @property {number} [year] - Год релиза.
 */
export interface Anime {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      image_url: string;
      large_image_url?: string;
    };
  };
  score: number;
  synopsis?: string;
  episodes?: number;
  status?: string;
  year?: number;
}

/**
 * Модель данных жанра аниме.
 *
 * @property {number} mal_id - Уникальный идентификатор жанра.
 * @property {string} name - Название жанра.
 * @property {number} count - Количество произведений в данном жанре.
 */
export interface Genre {
  mal_id: number;
  name: string;
  count: number;
}
