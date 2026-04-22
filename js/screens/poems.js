/* ═══════════════════════════════════════════════════
   SCREEN: poems — каталог стихов
   ═══════════════════════════════════════════════════ */

Router.register('main', {
  html: () => `
    <div class="app-header with-safe">
      <div class="header-title left" id="main-tab-title">Сборник</div>
      <div class="header-right" id="main-header-right"></div>
    </div>

    <!-- Tab panels -->
    <div id="tab-poems"    class="tab-panel scroll-area"></div>
    <div id="tab-library"  class="tab-panel scroll-area" style="display:none"></div>
    <div id="tab-discover" class="tab-panel scroll-area" style="display:none"></div>
    <div id="tab-profile"  class="tab-panel scroll-area" style="display:none"></div>

    <!-- Bottom nav -->
    <nav class="bottom-nav">
      <div class="nav-item active" data-tab="poems">
        ${Icons.book}<span class="nav-label">Стихи</span>
      </div>
      <div class="nav-item" data-tab="library">
        ${Icons.home}<span class="nav-label">Библиотека</span>
      </div>
      <div class="nav-item" data-tab="discover">
        ${Icons.compass}<span class="nav-label">Обзор</span>
      </div>
      <div class="nav-item" data-tab="profile">
        ${Icons.user}<span class="nav-label">Профиль</span>
      </div>
    </nav>
  `,

  onMount() {
    // Навигация вкладок
    document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
      item.addEventListener('click', () => PoemsScreen.switchTab(item.dataset.tab));
    });
    PoemsScreen.renderList();
  },
});

const PoemsScreen = {
  switchTab(tab) {
    haptic('light');
    State.currentTab = tab;

    // Обновляем навбар
    document.querySelectorAll('.nav-item[data-tab]').forEach(i =>
      i.classList.toggle('active', i.dataset.tab === tab)
    );
    // Показываем нужную панель
    ['poems', 'library', 'discover', 'profile'].forEach(t => {
      document.getElementById(`tab-${t}`).style.display = t === tab ? '' : 'none';
    });

    // Заголовок
    const titles = { poems: 'Сборник', library: 'Библиотека', discover: 'Обзор', profile: 'Профиль' };
    document.getElementById('main-tab-title').textContent = titles[tab] || '';

    // Кнопка справа в хедере
    const right = document.getElementById('main-header-right');
    if (tab === 'profile') {
      right.innerHTML = `<button class="header-btn" id="btn-open-settings" title="Настройки">${Icons.settings}</button>`;
      document.getElementById('btn-open-settings').addEventListener('click', () => {
        SettingsScreen.open();
      });
    } else {
      right.innerHTML = '';
    }

    // Ленивая загрузка вкладок
    if (tab === 'library')  LibraryScreen.load();
    if (tab === 'discover') DiscoverScreen.load();
    if (tab === 'profile')  ProfileScreen.render();
  },

  renderList() {
    const tab = document.getElementById('tab-poems');
    tab.innerHTML = `
      <div class="search-bar">
        <div class="search-wrap">
          ${Icons.search}
          <input type="search" class="search-input" id="poems-search" placeholder="Поиск стихов…">
        </div>
      </div>
      <div id="poems-list"></div>`;

    document.getElementById('poems-search').addEventListener('input', debounce(e => {
      const q = e.target.value.trim().toLowerCase();
      State.filteredPoems = q
        ? State.poems.filter(p =>
            p.title.toLowerCase().includes(q)  ||
            p.author.toLowerCase().includes(q) ||
            p.text.toLowerCase().includes(q))
        : [...State.poems];
      PoemsScreen.renderCards();
    }, 250));

    PoemsScreen.renderCards();
  },

  renderCards() {
    const list = document.getElementById('poems-list');
    if (!list) return;

    const poems = State.filteredPoems;
    if (!poems.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">📖</div><div class="empty-title">Стихи не найдены</div><div class="empty-text">Попробуйте другой запрос</div></div>`;
      return;
    }

    const readSet = new Set(State.me?.read_poems || []);
    const pinned  = State.me?.pinned_poem_id;

    list.innerHTML = poems.map(p => {
      const preview = p.text.split('\n').filter(l => l.trim()).slice(0, 2).join('\n');
      const isRead  = readSet.has(p.id);
      const isPin   = p.id === pinned;
      return `<div class="poem-card fade-in" data-id="${p.id}">
        <div class="poem-card-top">
          <div style="flex:1;min-width:0">
            <div class="poem-title">${esc(p.title)}</div>
            <div class="poem-author">${esc(p.author)}</div>
          </div>
          <div style="color:var(--tg-hint);opacity:.4;flex-shrink:0">${Icons.chevron}</div>
        </div>
        ${preview ? `<div class="poem-preview">${esc(preview)}</div>` : ''}
        ${(isRead || isPin || p.line_count) ? `
        <div class="poem-badges">
          ${isRead ? '<span class="badge read">✓ Прочитано</span>'   : ''}
          ${isPin  ? '<span class="badge pinned">📌 Закреплено</span>': ''}
          ${p.line_count ? `<span class="badge">${p.line_count} стр.</span>` : ''}
        </div>` : ''}
      </div>`;
    }).join('');

    list.querySelectorAll('.poem-card').forEach(card => {
      card.addEventListener('click', () => PoemDetailScreen.open(parseInt(card.dataset.id)));
    });
  },
};
