/* ═══════════════════════════════════════════════════
   SCREEN: library-detail — просмотр чужой библиотеки
   ═══════════════════════════════════════════════════ */

Router.register('library-detail', {
  html: () => `
    <div class="app-header with-safe">
      <div class="header-back" id="libdetail-back">${Icons.back} Назад</div>
      <div class="header-title" id="libdetail-title">Библиотека</div>
      <div class="header-right">
        <button class="header-btn" id="btn-libdetail-share">${Icons.share}</button>
      </div>
    </div>
    <div class="scroll-area" id="libdetail-scroll">
      <div id="libdetail-body"></div>
    </div>
  `,

  onMount() {
    document.getElementById('libdetail-back').addEventListener('click', () => Router.pop());
    document.getElementById('btn-libdetail-share').addEventListener('click', () => {
      const lib = State.currentLibDetail?.library;
      if (!lib) return;
      haptic('light');
      if (navigator.share) {
        navigator.share({ title: lib.name, text: `Библиотека стихов: ${lib.name}` });
      } else {
        toast('Ссылка скопирована');
      }
    });
    LibraryDetailScreen.render();
  },
});

const LibraryDetailScreen = {
  async open(id) {
    try {
      const r = await API.get(`/api/library/${id}`);
      State.currentLibDetail = r;
      Router.push('library-detail');
    } catch (e) { toast(e.message); }
  },

  render() {
    const r   = State.currentLibDetail;
    const el  = document.getElementById('libdetail-body');
    if (!r || !el) return;

    const lib   = r.library;
    const poems = r.poems;
    const isMine = lib.owner === State.me?.username;

    document.getElementById('libdetail-title').textContent = lib.name;

    const statusLabels = { pending: 'На модерации', published: 'Публичная', private: 'Приватная', rejected: 'Отклонена' };

    el.innerHTML = `
      <div class="lib-detail-hero">
        <div class="lib-detail-name">${esc(lib.name)}</div>
        ${lib.description ? `<div class="lib-detail-desc">${esc(lib.description)}</div>` : ''}
        <div class="lib-detail-stats">
          <div class="lib-detail-stat">@${esc(lib.owner)}</div>
          <div class="lib-detail-stat">${Icons.heart} ${lib.likes_count}</div>
          <div class="lib-detail-stat">${Icons.save} ${lib.saves_count}</div>
          <span class="status-chip ${lib.status}">${statusLabels[lib.status] || lib.status}</span>
        </div>
        ${!isMine && State.me ? `
        <div class="lib-detail-actions">
          <button class="btn-primary ${r.is_liked ? '' : 'btn-secondary'}" id="btn-lib-like" style="flex:1">
            ${r.is_liked ? '❤️ Нравится' : '🤍 Лайк'}
          </button>
          <button class="btn-primary ${r.is_saved ? '' : 'btn-secondary'}" id="btn-lib-save" style="flex:1">
            ${r.is_saved ? '✓ Сохранено' : '+ Сохранить'}
          </button>
        </div>` : ''}
      </div>

      <div class="section-header">Стихи (${poems.length})</div>
      ${poems.length === 0
        ? `<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-title">Пока пусто</div></div>`
        : poems.map(p => `
          <div class="poem-card ${p.poem_id ? 'clickable' : ''}" data-pid="${p.poem_id || 0}">
            <div class="poem-title">${esc(p.title)}</div>
            <div class="poem-author">${esc(p.author)}</div>
            <div class="poem-preview">${esc(p.text.split('\n').filter(l=>l.trim()).slice(0,2).join('\n'))}</div>
          </div>`).join('')
      }
      <div style="height:16px"></div>`;

    el.querySelectorAll('.poem-card[data-pid]').forEach(card => {
      const pid = parseInt(card.dataset.pid);
      if (!pid) return;
      card.addEventListener('click', () => PoemDetailScreen.open(pid));
    });

    document.getElementById('btn-lib-like')?.addEventListener('click', async () => {
      try {
        await API.post(`/api/library/${lib.id}/like`);
        haptic('medium');
        const fresh = await API.get(`/api/library/${lib.id}`);
        State.currentLibDetail = fresh;
        LibraryDetailScreen.render();
      } catch (e) { toast(e.message); }
    });

    document.getElementById('btn-lib-save')?.addEventListener('click', async () => {
      try {
        if (r.is_saved) {
          await API.del(`/api/library/${lib.id}/save`);
          toast('Убрано из сохранённых');
        } else {
          await API.post(`/api/library/${lib.id}/save`, {});
          toast('Сохранено');
        }
        haptic('medium');
        const fresh = await API.get(`/api/library/${lib.id}`);
        State.currentLibDetail = fresh;
        LibraryDetailScreen.render();
      } catch (e) { toast(e.message); }
    });
  },
};
