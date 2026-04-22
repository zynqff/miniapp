/* ═══════════════════════════════════════════════════
   SCREEN: profile — профиль пользователя (вкладка)
   ═══════════════════════════════════════════════════ */

const ProfileScreen = {
  render() {
    const el = document.getElementById('tab-profile');
    if (!el) return;

    const me     = State.me;
    const tgUser = State.tgUser;

    const displayName = tgUser
      ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ')
      : (me?.username || 'Пользователь');
    const handle   = tgUser?.username ? `@${tgUser.username}` : '';
    const avatarInitials = initials(displayName);
    const readCount = me?.read_poems?.length || 0;
    const libCount  = State.myLibraryPoems?.length || 0;
    const pinnedId  = me?.pinned_poem_id;
    const pinnedPoem = pinnedId ? State.poems.find(p => p.id === pinnedId) : null;

    el.innerHTML = `
      <!-- Hero -->
      <div class="profile-hero">
        <div class="profile-avatar">
          ${tgUser?.photo_url
            ? `<img src="${esc(tgUser.photo_url)}" alt="" onerror="this.style.display='none'">`
            : avatarInitials}
        </div>
        <div class="profile-name">${esc(displayName)}</div>
        ${handle ? `<div class="profile-handle">${esc(handle)}</div>` : ''}
        ${me?.is_admin ? '<div class="admin-badge">👑 Администратор</div>' : ''}
        <div class="profile-stats">
          <div class="pstat">
            <div class="pstat-n">${readCount}</div>
            <div class="pstat-l">Прочитано</div>
          </div>
          <div class="pstat">
            <div class="pstat-n">${State.poems.length}</div>
            <div class="pstat-l">В каталоге</div>
          </div>
          <div class="pstat">
            <div class="pstat-n">${libCount}</div>
            <div class="pstat-l">В библиотеке</div>
          </div>
        </div>
      </div>

      <!-- Закреплённый стих -->
      ${pinnedPoem ? `
      <div class="pinned-card fade-in" id="pinned-poem-card">
        <div class="pinned-card-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          Закреплённое стихотворение
        </div>
        <div class="poem-title">${esc(pinnedPoem.title)}</div>
        <div class="poem-author">${esc(pinnedPoem.author)}</div>
        <div class="poem-preview">${esc(pinnedPoem.text.split('\n').filter(l=>l.trim()).slice(0,2).join('\n'))}</div>
      </div>` : ''}

      <!-- Действия -->
      <div class="section-header" style="padding-top:${pinnedPoem ? '4px' : '16px'}">Действия</div>
      <div class="section-block">
        <div class="cell" id="cell-open-chat">
          <div class="cell-icon">${Icons.chat}</div>
          <div class="cell-body">
            <div class="cell-title">AI-помощник</div>
            <div class="cell-subtitle">Обсудить стихи с ИИ</div>
          </div>
          <div class="cell-chevron">${Icons.chevron}</div>
        </div>
        ${me?.is_admin ? `
        <div class="cell" id="cell-admin">
          <div class="cell-icon">${Icons.crown}</div>
          <div class="cell-body">
            <div class="cell-title">Панель администратора</div>
            <div class="cell-subtitle">Управление контентом</div>
          </div>
          <div class="cell-chevron">${Icons.chevron}</div>
        </div>` : ''}
      </div>

      <!-- Личные заметки -->
      <div class="section-header">Личные заметки</div>
      <div class="section-block">
        <div style="padding:12px 16px">
          <textarea class="input-field" id="user-notes" rows="4"
            placeholder="Ваши заметки о прочитанных стихах…"
            style="resize:vertical"
            maxlength="2000">${esc(me?.user_data || '')}</textarea>
          <div style="display:flex;justify-content:flex-end;margin-top:6px">
            <span style="font-size:11px;color:var(--tg-hint)" id="notes-counter">${(me?.user_data || '').length}/2000</span>
          </div>
          <button class="btn-primary" id="btn-save-notes" style="margin-top:8px">Сохранить заметки</button>
        </div>
      </div>

      <!-- AI-ключ -->
      <div class="section-header">AI-доступ</div>
      <div class="section-block">
        <div class="key-area">
          <div class="key-desc">Введите ключ доступа для использования AI-помощника без ограничений</div>
          <input class="input-field" id="ai-key-input" type="password"
            placeholder="Ключ доступа" autocomplete="off">
          <button class="btn-primary btn-secondary" id="btn-verify-key" style="margin-top:10px">Проверить ключ</button>
        </div>
      </div>

      <div style="height:16px"></div>`;

    // Закреплённый стих → открыть
    document.getElementById('pinned-poem-card')?.addEventListener('click', () => {
      if (pinnedPoem) PoemDetailScreen.open(pinnedPoem.id);
    });

    // Чат
    document.getElementById('cell-open-chat')?.addEventListener('click', () => ChatScreen.open());

    // Админ
    document.getElementById('cell-admin')?.addEventListener('click', () => AdminScreen.open());

    // Заметки: счётчик
    const notesEl = document.getElementById('user-notes');
    notesEl?.addEventListener('input', () => {
      document.getElementById('notes-counter').textContent = `${notesEl.value.length}/2000`;
    });

    // Сохранить заметки
    document.getElementById('btn-save-notes')?.addEventListener('click', async () => {
      const val = document.getElementById('user-notes')?.value || '';
      try {
        await API.post('/api/profile', { user_data: val });
        if (State.me) State.me.user_data = val;
        haptic('success');
        toast('Заметки сохранены');
      } catch (e) { toast(e.message); }
    });

    // Проверить AI-ключ
    document.getElementById('btn-verify-key')?.addEventListener('click', async () => {
      const key = document.getElementById('ai-key-input')?.value.trim();
      if (!key) { toast('Введите ключ'); return; }
      try {
        await API.post('/api/ai/verify_key', { key });
        haptic('success');
        toast('Ключ принят ✓');
        document.getElementById('ai-key-input').value = '';
      } catch (e) { toast(e.message); }
    });
  },
};
