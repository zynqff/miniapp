/* ═══════════════════════════════════════════════════
   SCREEN: discover — рекомендации, поиск библиотек
   ═══════════════════════════════════════════════════ */

const DiscoverScreen = {
  _loaded: false,

  async load(force = false) {
    if (this._loaded && !force) return;
    const el = document.getElementById('tab-discover');
    if (!el) return;

    el.innerHTML = `<div class="empty-state"><div class="spinner"></div></div>`;
    try {
      const r = await API.get('/api/recommendations');
      State.recommendations = r;
      this._loaded = true;
      this.render();
    } catch {
      this.renderFallback();
    }
  },

  render() {
    const el = document.getElementById('tab-discover');
    if (!el) return;
    const r = State.recommendations;

    let html = `
      <!-- Поиск библиотек -->
      <div class="search-bar">
        <div class="search-wrap">
          ${Icons.search}
          <input type="search" class="search-input" id="lib-search-input" placeholder="Поиск библиотек…">
        </div>
      </div>
      <div id="lib-search-results"></div>`;

    if (r?.poem_of_day) {
      const pod = r.poem_of_day;
      html += `
        <div class="pod-card" id="pod-card">
          <div class="pod-label">✨ Стих дня</div>
          <div class="pod-title">${esc(pod.title)}</div>
          <div class="pod-author">${esc(pod.author)}</div>
          <div class="pod-preview">${esc(pod.text.split('\n').filter(l=>l.trim()).slice(0,4).join('\n'))}</div>
        </div>`;
    }

    if (r?.top_libraries?.length) {
      html += `<div class="section-header" style="padding:14px 16px 6px">Популярные библиотеки</div>`;
      html += r.top_libraries.map(lib => `
        <div class="lib-card" data-libid="${lib.id}">
          <div class="lib-card-row">
            <div>
              <div class="lib-card-name">${esc(lib.name)}</div>
              <div class="lib-card-owner">@${esc(lib.owner)}</div>
            </div>
            <span class="status-chip published">Публичная</span>
          </div>
          <div class="lib-card-stats">
            <div class="lib-card-stat">${Icons.heart} ${lib.likes_count}</div>
            <div class="lib-card-stat">${Icons.save} ${lib.saves_count}</div>
          </div>
        </div>`).join('');
    }

    if (r?.popular_poems?.length) {
      html += `<div class="section-header" style="padding:14px 16px 6px">Популярные стихи</div>`;
      html += r.popular_poems.map(p => `
        <div class="poem-card" data-pid="${p.id}">
          <div class="poem-card-top">
            <div style="flex:1"><div class="poem-title">${esc(p.title)}</div><div class="poem-author">${esc(p.author)}</div></div>
            <div style="opacity:.4">${Icons.chevron}</div>
          </div>
        </div>`).join('');
    }

    html += '<div style="height:16px"></div>';
    el.innerHTML = html;

    // Стих дня
    document.getElementById('pod-card')?.addEventListener('click', () => {
      const pid = r.poem_of_day?.id;
      if (pid) PoemDetailScreen.open(pid);
    });

    // Библиотеки
    el.querySelectorAll('[data-libid]').forEach(c =>
      c.addEventListener('click', () => LibraryDetailScreen.open(parseInt(c.dataset.libid)))
    );

    // Стихи
    el.querySelectorAll('.poem-card[data-pid]').forEach(c =>
      c.addEventListener('click', () => PoemDetailScreen.open(parseInt(c.dataset.pid)))
    );

    // Поиск библиотек
    document.getElementById('lib-search-input')?.addEventListener('input',
      debounce(e => DiscoverScreen.searchLibraries(e.target.value.trim()), 400)
    );
  },

  renderFallback() {
    const el = document.getElementById('tab-discover');
    if (!el) return;
    el.innerHTML = `
      <div class="search-bar">
        <div class="search-wrap">
          ${Icons.search}
          <input type="search" class="search-input" id="lib-search-input" placeholder="Поиск библиотек…">
        </div>
      </div>
      <div id="lib-search-results"></div>
      <div class="empty-state">
        <div class="empty-icon">🔭</div>
        <div class="empty-title">Обзор недоступен</div>
        <div class="empty-text">Используйте поиск для нахождения библиотек</div>
      </div>`;
    document.getElementById('lib-search-input')?.addEventListener('input',
      debounce(e => DiscoverScreen.searchLibraries(e.target.value.trim()), 400)
    );
  },

  async searchLibraries(q) {
    const resultsEl = document.getElementById('lib-search-results');
    if (!resultsEl) return;
    if (!q) { resultsEl.innerHTML = ''; return; }

    resultsEl.innerHTML = `<div style="padding:10px 16px;color:var(--tg-hint);font-size:13px">Поиск…</div>`;
    try {
      const r = await API.get(`/api/library/search?q=${encodeURIComponent(q)}`);
      if (!r?.libraries?.length) {
        resultsEl.innerHTML = `<div class="empty-state" style="padding:20px"><div class="empty-title">Ничего не найдено</div></div>`;
        return;
      }
      resultsEl.innerHTML = `
        <div class="section-header">Результаты</div>
        ${r.libraries.map(lib => `
          <div class="lib-card" data-libid="${lib.id}">
            <div class="lib-card-name">${esc(lib.name)}</div>
            <div class="lib-card-owner">@${esc(lib.owner)}</div>
          </div>`).join('')}`;
      resultsEl.querySelectorAll('[data-libid]').forEach(c =>
        c.addEventListener('click', () => LibraryDetailScreen.open(parseInt(c.dataset.libid)))
      );
    } catch (e) {
      resultsEl.innerHTML = `<div style="padding:10px 16px;color:var(--tg-destructive);font-size:13px">${esc(e.message)}</div>`;
    }
  },
};
