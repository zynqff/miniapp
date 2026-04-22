/* ═══════════════════════════════════════════════════
   SCREEN: library — моя библиотека (вкладка)
   ═══════════════════════════════════════════════════ */

const LibraryScreen = {
  _loaded: false,

  async load(force = false) {
    if (this._loaded && !force) return;
    const el = document.getElementById('tab-library');
    if (!el) return;

    el.innerHTML = `<div class="empty-state"><div class="spinner"></div></div>`;
    if (!State.me) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔒</div><div class="empty-title">Не авторизован</div><div class="empty-text">Не удалось загрузить библиотеку</div></div>`;
      return;
    }

    try {
      const r = await API.get('/api/library/mine');
      State.myLibrary      = r.library;
      State.myLibraryPoems = r.poems || [];
      this._loaded = true;
      this.render();
    } catch (e) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">📚</div><div class="empty-title">Ошибка</div><div class="empty-text">${esc(e.message)}</div></div>`;
    }
  },

  render() {
    const el = document.getElementById('tab-library');
    if (!el) return;
    const lib   = State.myLibrary;
    const poems = State.myLibraryPoems;

    if (!lib) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">📚</div><div class="empty-title">Библиотека не найдена</div></div>`;
      return;
    }

    const statusLabels = { pending: 'На модерации', published: 'Опубликована', private: 'Приватная', rejected: 'Отклонена' };

    el.innerHTML = `
      <div class="lib-detail-hero">
        <div class="lib-detail-name">${esc(lib.name)}</div>
        ${lib.description ? `<div class="lib-detail-desc">${esc(lib.description)}</div>` : ''}
        <div class="lib-detail-stats">
          <div class="lib-detail-stat">${Icons.book} ${poems.length} стихов</div>
          <div class="lib-detail-stat">${Icons.heart} ${lib.likes_count}</div>
          <span class="status-chip ${lib.status}">${statusLabels[lib.status] || lib.status}</span>
        </div>
        <div class="lib-detail-actions">
          ${lib.status === 'private' || lib.status === 'rejected'
            ? `<button class="btn-primary" id="btn-lib-publish" style="flex:1">Опубликовать</button>` : ''}
          ${lib.status === 'published'
            ? `<button class="btn-primary btn-secondary" id="btn-lib-unpublish" style="flex:1">Снять с публикации</button>` : ''}
          <button class="btn-primary btn-secondary" id="btn-lib-edit" style="flex:1">Редактировать</button>
        </div>
      </div>

      <div class="section-header">Стихи в библиотеке</div>

      ${poems.length === 0
        ? `<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-title">Пока пусто</div><div class="empty-text">Откройте любой стих и нажмите на иконку дома</div></div>`
        : poems.map(p => `
          <div class="poem-card" data-eid="${p.id}" data-pid="${p.poem_id || 0}">
            <div class="poem-card-top">
              <div style="flex:1;min-width:0">
                <div class="poem-title">${esc(p.title)}</div>
                <div class="poem-author">${esc(p.author)}${p.is_custom ? ' · <em>свой</em>' : ''}</div>
              </div>
              <div style="display:flex;align-items:center;gap:6px">
                ${p.is_pinned ? '<span style="color:#ff9800;font-size:14px">📌</span>' : ''}
                ${p.is_read   ? '<span style="color:#4caf50;font-size:13px">✓</span>' : ''}
                <button class="header-btn lib-del-btn" data-eid="${p.id}" style="width:28px;height:28px;color:var(--tg-hint)">
                  ${Icons.trash}
                </button>
              </div>
            </div>
            <div class="poem-preview">${esc(p.text.split('\n').filter(l=>l.trim()).slice(0,2).join('\n'))}</div>
          </div>`).join('')
      }
      <div style="height:16px"></div>`;

    // Клики по стихам
    el.querySelectorAll('.poem-card[data-eid]').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('.lib-del-btn')) return;
        const pid = parseInt(card.dataset.pid);
        if (pid) PoemDetailScreen.open(pid);
      });
    });

    // Кнопки удаления
    el.querySelectorAll('.lib-del-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const eid = parseInt(btn.dataset.eid);
        confirmAction('Удалить стих из библиотеки?', async () => {
          try {
            await API.del(`/api/library/mine/poems/${eid}`);
            haptic('medium');
            await this.load(true);
            toast('Удалено');
          } catch (err) { toast(err.message); }
        });
      });
    });

    // Управление
    document.getElementById('btn-lib-publish')?.addEventListener('click', async () => {
      try { await API.post('/api/library/mine/publish'); haptic('success'); await this.load(true); toast('Отправлено на модерацию'); }
      catch (e) { toast(e.message); }
    });
    document.getElementById('btn-lib-unpublish')?.addEventListener('click', async () => {
      try { await API.post('/api/library/mine/unpublish'); haptic('medium'); await this.load(true); toast('Снято с публикации'); }
      catch (e) { toast(e.message); }
    });
    document.getElementById('btn-lib-edit')?.addEventListener('click', () => this.showEditForm());
  },

  showEditForm() {
    const lib = State.myLibrary;
    const el  = document.getElementById('tab-library');
    const existing = el.querySelector('#lib-edit-form');
    if (existing) { existing.remove(); return; }

    const form = document.createElement('div');
    form.id = 'lib-edit-form';
    form.style.cssText = 'background:var(--tg-section-bg);border-bottom:1px solid var(--tg-section-sep);padding:14px 16px;display:flex;flex-direction:column;gap:10px';
    form.innerHTML = `
      <div class="input-label">Название</div>
      <input class="input-field" id="lib-edit-name" value="${esc(lib.name)}" maxlength="100">
      <div class="input-label">Описание</div>
      <input class="input-field" id="lib-edit-desc" value="${esc(lib.description || '')}" maxlength="300">
      <div class="btn-row">
        <button class="btn-primary" id="lib-edit-save">Сохранить</button>
        <button class="btn-primary btn-secondary" id="lib-edit-cancel">Отмена</button>
      </div>`;

    el.querySelector('.lib-detail-hero').insertAdjacentElement('afterend', form);

    document.getElementById('lib-edit-save').addEventListener('click', async () => {
      const name = document.getElementById('lib-edit-name').value.trim();
      const desc = document.getElementById('lib-edit-desc').value.trim();
      if (!name) { toast('Введите название'); return; }
      try {
        await API.put('/api/library/mine', { name, description: desc });
        haptic('success'); toast('Сохранено');
        await this.load(true);
      } catch (e) { toast(e.message); }
    });
    document.getElementById('lib-edit-cancel').addEventListener('click', () => form.remove());
  },
};
