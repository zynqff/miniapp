/* ═══════════════════════════════════════════════════
   STATE — глобальное состояние приложения
   ═══════════════════════════════════════════════════ */

const State = {
  /* Auth */
  accessToken:  null,
  refreshToken: null,
  me:           null,   // { username, is_admin, read_poems, pinned_poem_id, user_data }

  /* Telegram */
  tgUser: null,         // { id, first_name, last_name, username, photo_url }

  /* Poems */
  poems:         [],    // весь каталог
  filteredPoems: [],    // после поиска
  currentPoem:   null,  // открытый стих

  /* Library */
  myLibrary:      null,
  myLibraryPoems: [],
  currentLibDetail: null,  // { library, poems, is_liked, is_saved }

  /* Discover */
  recommendations: null,   // { poem_of_day, top_libraries, popular_poems }

  /* Chat */
  chatMessages:  [],        // [{ role, content, time, isError }]
  chatLoading:   false,

  /* UI */
  currentTab: 'poems',

  /* Settings */
  settings: {
    customAccent: null,   // hex string или null
    fontSize: '16px',
  },

  /* Temp: poem to add to library */
  poemForLib: null,

  /* App config from backend */
  appConfig: {},
};
