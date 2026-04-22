/* ═══════════════════════════════════════════════════
   TG — Telegram WebApp SDK обёртка + авторизация
   ═══════════════════════════════════════════════════ */

const TG = {
  /** true если запущено в реальном Telegram, false если в браузере */
  isReal: false,

  /** Инициализирует Telegram SDK, применяет тему */
  init() {
    const tg = window.Telegram?.WebApp;

    // Считаем "реальным TG" если initData непустая строка
    // (в браузере tg.initData === '' или объект отсутствует)
    if (tg && tg.initData && tg.initData.length > 0) {
      this.isReal = true;
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation();
      tg.onEvent('themeChanged', () => this.applyTheme(tg.themeParams));
    } else {
      // Открыто в обычном браузере — устанавливаем dev-мок
      this._installMock();
    }

    State.tgUser = window.Telegram.WebApp.initDataUnsafe?.user || null;
    this.applyTheme(window.Telegram.WebApp.themeParams || {});
  },

  /** Dev-мок когда открываем в браузере без TG */
  _installMock() {
    if (!window.Telegram) window.Telegram = { WebApp: {} };
    const wb = window.Telegram.WebApp;

    // Заполняем только пустые поля — не перетираем если SDK уже что-то дал
    wb.initData = 'dev_mode';
    if (!wb.initDataUnsafe?.user) {
      wb.initDataUnsafe = {
        user: {
          id:         99999999,
          first_name: 'Dev',
          last_name:  'User',
          username:   'devuser',
          photo_url:  null,
        },
      };
    }
    wb.themeParams    = wb.themeParams    || {};
    wb.ready          = wb.ready          || (() => {});
    wb.expand         = wb.expand         || (() => {});
    wb.enableClosingConfirmation = wb.enableClosingConfirmation || (() => {});
    wb.onEvent        = wb.onEvent        || (() => {});
    wb.close          = wb.close          || (() => {});
    wb.HapticFeedback = wb.HapticFeedback || {
      impactOccurred:       () => {},
      notificationOccurred: () => {},
    };
    wb.showPopup = wb.showPopup || ((opts, cb) => {
      if (confirm(opts.message)) cb?.('ok');
    });

    console.info('[TG] Dev mode — running outside Telegram');
  },

  /** Применяет цвета темы Telegram к CSS-переменным */
  applyTheme(params = {}) {
    const root = document.documentElement;
    const map = {
      '--tg-bg':          params.bg_color,
      '--tg-surface':     params.secondary_bg_color,
      '--tg-text':        params.text_color,
      '--tg-hint':        params.hint_color,
      '--tg-link':        params.link_color,
      '--tg-button':      params.button_color,
      '--tg-button-text': params.button_text_color,
      '--tg-accent':      params.accent_text_color || params.link_color,
      '--tg-section-bg':  params.section_bg_color  || params.bg_color,
      '--tg-section-sep': params.section_separator_color,
      '--tg-destructive': params.destructive_text_color,
      '--tg-header-bg':   params.header_bg_color,
    };
    for (const [k, v] of Object.entries(map)) {
      if (v) root.style.setProperty(k, v);
    }
    // Кастомный акцент перекрывает TG-кнопку
    const s = Store.get('ss_settings');
    if (s?.customAccent) this.applyAccent(s.customAccent);
  },

  /** Устанавливает кастомный акцентный цвет */
  applyAccent(hex) {
    if (!hex) return;
    const root = document.documentElement;
    root.style.setProperty('--tg-button', hex);
    root.style.setProperty('--tg-accent', hex);
    root.style.setProperty('--tg-link',   hex);
    // Авто-контраст текста на кнопке
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    root.style.setProperty('--tg-button-text', lum > 145 ? '#000000' : '#ffffff');
  },

  /** Авторизация через /api/auth/telegram */
  async auth() {
    const wb       = window.Telegram?.WebApp;
    const initData = wb?.initData;
    if (!initData) return false;

    const isDev   = (initData === 'dev_mode');
    const devUser = isDev ? (wb.initDataUnsafe?.user || null) : null;

    try {
      const data = await API.telegramAuth(initData, devUser);
      if (!data?.access_token) return false;

      State.accessToken  = data.access_token;
      State.refreshToken = data.refresh_token;
      Store.set('ss_access',  State.accessToken);
      Store.set('ss_refresh', State.refreshToken);
      return true;
    } catch (e) {
      console.error('[TG.auth] failed:', e.message);
      // Подсказка если сервер вернул 403 на dev_mode
      if (isDev && String(e.message).includes('403')) {
        console.warn(
          '[TG.auth] Сервер запрещает dev_mode.\n' +
          'Решение: добавьте DEV_MODE=true в .env бекенда.'
        );
      }
      return false;
    }
  },
};
