/* ═══════════════════════════════════════════════════
   SCREEN: settings — настройки и кастомизация темы
   ═══════════════════════════════════════════════════ */

Router.register('settings', {
  html: () => `
    <div class="app-header with-safe">
      <div class="header-back" id="settings-back">${Icons.back} Назад</div>
      <div class="header-title">Настройки</div>
      <div class="header-right"></div>
    </div>
    <div class="scroll-area" id="settings-scroll">
      <div id="settings-body" style="padding-bottom:32px"></div>
    </div>
  `,

  onMount() {
    document.getElementById('settings-back').addEventListener('click', () => Router.pop());
    SettingsScreen.render();
  },
});

const SettingsScreen = {
  open() {
    Router.push('settings');
  },

  render() {
    const el = document.getElementById('settings-body');
    if (!el) return;

    const s = State.settings;
    const currentAccent = s.customAccent || '';
    const currentSize   = s.fontSize || '16px';

    el.innerHTML = `
      <!-- Акцентный цвет -->
      <div class="settings-section-label">Акцентный цвет</div>
      <div class="section-block">
        <div class="color-grid" id="color-grid">
          ${Config.ACCENT_COLORS.map(hex => `
            <div class="color-swatch ${currentAccent === hex ? 'selected' : ''}"
              data-hex="${hex}"
              style="background:${hex};color:${hex}"
              title="${hex}">
            </div>`).join('')}
          <!-- Сброс к TG-цвету -->
          <div class="color-swatch ${!currentAccent ? 'selected' : ''}"
            data-hex=""
            style="background: conic-gradient(red, yellow, lime, cyan, blue, magenta, red)"
            title="Цвет Telegram">
          </div>
        </div>
        <div style="padding:4px 16px 12px;font-size:12px;color:var(--tg-hint)">
          Последний вариант сбрасывает к цвету вашей темы Telegram
        </div>
      </div>

      <!-- Размер шрифта -->
      <div class="settings-section-label">Размер текста</div>
      <div class="section-block">
        ${Config.FONT_SIZES.map(f => `
          <div class="toggle-row font-size-row" data-size="${f.value}">
            <span class="toggle-label" style="font-size:${f.value}">${f.label}</span>
            <div style="width:20px;height:20px;border-radius:50%;border:2px solid var(--tg-button);
              display:flex;align-items:center;justify-content:center;flex-shrink:0">
              ${currentSize === f.value
                ? `<div style="width:10px;height:10px;border-radius:50%;background:var(--tg-button)"></div>`
                : ''}
            </div>
          </div>`).join('')}
      </div>

      <!-- О приложении -->
      <div class="settings-section-label">О приложении</div>
      <div class="section-block">
        <div class="cell" style="cursor:default">
          <div class="cell-icon">📖</div>
          <div class="cell-body">
            <div class="cell-title">Сборник Стихов</div>
            <div class="cell-subtitle">Telegram Mini App</div>
          </div>
        </div>
        <div class="cell" style="cursor:default">
          <div class="cell-icon">${Icons.user}</div>
          <div class="cell-body">
            <div class="cell-title">Аккаунт</div>
            <div class="cell-subtitle">${esc(State.tgUser ? `@${State.tgUser.username || State.me?.username || '—'}` : State.me?.username || '—')}</div>
          </div>
        </div>
      </div>

      <div style="height:16px"></div>`;

    // Выбор цвета
    el.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        const hex = swatch.dataset.hex;
        SettingsScreen.setAccent(hex);
        el.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
      });
    });

    // Выбор размера шрифта
    el.querySelectorAll('.font-size-row').forEach(row => {
      row.addEventListener('click', () => {
        const size = row.dataset.size;
        SettingsScreen.setFontSize(size);
        SettingsScreen.render(); // перерисовать с новым выбором
      });
    });
  },

  setAccent(hex) {
    State.settings.customAccent = hex || null;
    if (hex) {
      TG.applyAccent(hex);
    } else {
      // Сброс: применяем тему TG заново
      TG.applyTheme(window.Telegram?.WebApp?.themeParams || {});
    }
    this._saveSettings();
    haptic('light');
  },

  setFontSize(size) {
    State.settings.fontSize = size;
    document.documentElement.style.fontSize = size;
    this._saveSettings();
    haptic('light');
  },

  _saveSettings() {
    Store.set('ss_settings', State.settings);
  },
};
