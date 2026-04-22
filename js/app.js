/* ═══════════════════════════════════════════════════
   APP — точка входа, загрузка и старт
   ═══════════════════════════════════════════════════ */

async function boot() {
  // 1. Инициализируем Telegram SDK
  TG.init();

  // 2. Восстанавливаем настройки
  const savedSettings = Store.get('ss_settings');
  if (savedSettings) {
    State.settings = { ...State.settings, ...savedSettings };
    if (savedSettings.customAccent) TG.applyAccent(savedSettings.customAccent);
    if (savedSettings.fontSize)     document.documentElement.style.fontSize = savedSettings.fontSize;
  }

  // 3. Монтируем все экраны в DOM
  Router.mountAll();

  // 4. Восстанавливаем токены из localStorage
  State.accessToken  = Store.get('ss_access');
  State.refreshToken = Store.get('ss_refresh');

  // 5. Пробуем получить профиль с сохранёнными токенами
  if (State.accessToken) {
    try {
      State.me = await API.get('/api/me');
    } catch {
      State.accessToken  = null;
      State.refreshToken = null;
    }
  }

  // 6. Если профиля нет — авторизуемся через Telegram
  if (!State.me) {
    const ok = await TG.auth();
    if (ok) {
      try { State.me = await API.get('/api/me'); } catch {}
    }
  }

  // 7. Загружаем публичный каталог стихов
  try {
    const r = await API.get('/api/poems');
    State.poems         = r?.poems || [];
    State.filteredPoems = [...State.poems];
  } catch {
    State.poems         = [];
    State.filteredPoems = [];
  }

  // 8. Скрываем загрузочный экран
  const loading = document.getElementById('loading-screen');
  loading.classList.add('hidden');
  setTimeout(() => loading.style.display = 'none', 320);

  // 9. Показываем приложение
  document.getElementById('app').classList.add('ready');

  // 10. Стартуем на главном экране
  Router.start('main');

  // Рендерим список стихов (первая вкладка)
  PoemsScreen.renderList();
}

// Запуск
document.addEventListener('DOMContentLoaded', boot);
