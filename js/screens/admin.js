/* ═══════════════════════════════════════════════════
   SCREEN: admin — панель администратора
   ═══════════════════════════════════════════════════ */

Router.register('admin', {
  html: () => `
    <div class="app-header with-safe">
      <div class="header-back" id="admin-back">${Icons.back} Назад</div>
      <div class="header-title">Администратор</div>
      <div class="header-right"></div>
    </div>
    <div class="scroll-area" id="admin-scroll">
      <div id="admin-body" style="padding-bottom:32px"></div>
    </div>
  `,

  onMount() {
    document.getElementById('admin-back').addEventListener('click', () => Router.pop());
    AdminScreen.render();
  },
});

const AdminScreen = {
  open() {
    if (!State.me?.is_admin) { toast('Нет доступа'); return; }
    Router.push('admin');
  },

  render() {
    const el = document.getElementById('admin-body');
    if (!el) return;

    el.innerHTML = `
      <!-- Добавить стих -->
      <div class="settings-section-label">Добавить стих в каталог</div>
      <div class="section-block">
        <div class="form-group">
          <div class="input-label">Название *</div>
          <input class="input-field" id="admin-poem-title" placeholder="Название стиха" maxlength="300">
        </div>
        <div class="form-group">
          <div class="input-label">Автор *</div>
          <input class="input-field" id="admin-poem-author" placeholder="Имя автора" maxlength="200">
        </div>
        <div class="form-group">
          <div class="input-label">Текст *</div>
          <textarea class="input-field" id="admin-poem-text" rows="8"
            placeholder="Введите текст стиха…" style="resize:vertical"></textarea>
        </div>
        <div style="padding:0 16px 16px">
          <button class="btn-primary" id="btn-admin-add-poem">Добавить стих</button>
        </div>
      </div>

      <!-- Стих дня -->
      <div class="settings-section-label">Стих дня</div>
      <div class="section-block">
        <div class="form-group">
          <div class="input-label">ID стиха</div>
          <input class="input-field" id="admin-pod-id" type="number" placeholder="Введите ID стиха">
        </div>
        <div style="padding:0 16px 16px">
          <button class="btn-primary btn-secondary" id="btn-set-pod">Установить стих дня</button>
        </div>
      </div>

      <!-- Модерация библиотек -->
      <div class="settings-section-label">Библиотеки на модерации</div>
      <div id="admin-pending-libs">
        <div style="padding:12px 16px;color:var(--tg-hint);font-size:13px">Загрузка…</div>
      </div>

      <!-- AI-ключи -->
      <div class="settings-section-label">AI-ключи доступа</div>
      <div class="section-block">
        <div class="form-group">
          <div class="input-label">Срок действия (часов, 0 = бессрочно)</div>
          <input class="input-field" id="admin-key-hours" type="number" value="0" min="0">
        </div>
        <div class="form-group">
          <div class="input-label">Дневной лимит (0 = без лимита)</div>
          <input class="input-field" id="admin-key-limit" type="number" value="0" min="0">
        </div>
        <div style="padding:0 16px 16px">
          <button class="btn-primary btn-secondary" id="btn-gen-key">Сгенерировать ключ</button>
        </div>
        <div id="admin-gen-key-result" style="padding:0 16px 12px;font-family:monospace;font-size:13px;color:var(--tg-accent);word-break:break-all"></div>
      </div>

      <div id="admin-keys-list">
        <div style="padding:12px 16px;color:var(--tg-hint);font-size:13px">Загрузка ключей…</div>
      </div>

      <div style="height:16px"></div>`;

    // Добавить стих
    document.getElementById('btn-admin-add-poem').addEventListener('click', async () => {
      const title  = document.getElementById('admin-poem-title').value.trim();
      const author = document.getElementById('admin-poem-author').value.trim();
      const text   = document.getElementById('admin-poem-text').value.trim();
      if (!title || !author || !text) { toast('Заполните все поля'); return; }
      try {
        const r = await API.post('/api/poems', { title, author, text });
        haptic('success');
        toast(`Стих добавлен (ID ${r.poem?.id})`);
        // Обновить локальный каталог
        State.poems.push(r.poem);
        State.filteredPoems = [...State.poems];
        PoemsScreen.renderCards();
        document.getElementById('admin-poem-title').value  = '';
        document.getElementById('admin-poem-author').value = '';
        document.getElementById('admin-poem-text').value   = '';
      } catch (e) { toast(e.message); }
    });

    // Стих дня
    document.getElementById('btn-set-pod').addEventListener('click', async () => {
      const id = parseInt(document.getElementById('admin-pod-id').value);
      if (!id) { toast('Введите ID'); return; }
      try {
        await API.post('/api/admin/poem_of_day', { poem_id: id });
        haptic('success');
        toast('Стих дня обновлён');
        DiscoverScreen._loaded = false;
      } catch (e) { toast(e.message); }
    });

    // Загрузить библиотеки на модерации
    AdminScreen.loadPendingLibs();

    // Сгенерировать AI-ключ
    document.getElementById('btn-gen-key').addEventListener('click', async () => {
      const hours = parseInt(document.getElementById('admin-key-hours').value) || 0;
      const limit = parseInt(document.getElementById('admin-key-limit').value) || 0;
      try {
        const r = await API.post('/api/ai/generate_key', {
          expires_in_hours: hours,
          daily_limit: limit,
        });
        haptic('success');
        const resultEl = document.getElementById('admin-gen-key-result');
        resultEl.textContent = r.key;
        resultEl.onclick = () => {
          navigator.clipboard?.writeText(r.key);
          toast('Ключ скопирован');
        };
        AdminScreen.loadKeys();
      } catch (e) { toast(e.message); }
    });

    // Загрузить ключи
    AdminScreen.loadKeys();
  },

  async loadPendingLibs() {
    const el = document.getElementById('admin-pending-libs');
    if (!el) return;
    try {
      const r = await API.get('/api/admin/libraries/pending');
      const libs = r?.libraries || [];
      if (!libs.length) {
        el.innerHTML = `<div style="padding:10px 16px;color:var(--tg-hint);font-size:13px">Нет библиотек на модерации</div>`;
        return;
      }
      el.innerHTML = `<div class="section-block">` + libs.map(lib => `
        <div style="padding:12px 16px;border-bottom:1px solid var(--tg-section-sep)">
          <div style="font-family:var(--font-display);font-size:14px;font-weight:600">${esc(lib.name)}</div>
          <div style="font-size:12px;color:var(--tg-hint);margin-top:2px">@${esc(lib.owner)}</div>
          ${lib.description ? `<div style="font-size:12px;color:var(--tg-hint);margin-top:4px;font-style:italic">${esc(lib.description)}</div>` : ''}
          <div class="btn-row" style="margin-top:10px">
            <button class="btn-primary" data-libid="${lib.id}" data-action="approve" style="font-size:13px;padding:8px">✓ Одобрить</button>
            <button class="btn-primary btn-danger" data-libid="${lib.id}" data-action="reject" style="font-size:13px;padding:8px">✗ Отклонить</button>
          </div>
        </div>`).join('') + `</div>`;

      el.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const libId  = parseInt(btn.dataset.libid);
          const action = btn.dataset.action;
          let reason = '';
          if (action === 'reject') {
            reason = prompt('Причина отклонения:') || '';
          }
          try {
            await API.post(`/api/admin/libraries/${libId}/moderate`, {
              action,
              reject_reason: reason,
            });
            haptic('success');
            toast(action === 'approve' ? 'Одобрено' : 'Отклонено');
            AdminScreen.loadPendingLibs();
          } catch (e) { toast(e.message); }
        });
      });
    } catch (e) {
      el.innerHTML = `<div style="padding:10px 16px;color:var(--tg-destructive);font-size:13px">${esc(e.message)}</div>`;
    }
  },

  async loadKeys() {
    const el = document.getElementById('admin-keys-list');
    if (!el) return;
    try {
      const keys = await API.get('/api/ai/keys');
      if (!keys?.length) {
        el.innerHTML = '';
        return;
      }
      el.innerHTML = `
        <div class="settings-section-label">Активные AI-ключи</div>
        <div class="section-block">
          ${keys.map(k => `
            <div class="admin-key-row">
              <div style="flex:1;min-width:0">
                <div class="admin-key-mono">${esc(k.key)}</div>
                <div style="font-size:11px;color:var(--tg-hint);margin-top:2px">
                  Использований сегодня: ${k.usage_today}
                  ${k.daily_limit ? ` / ${k.daily_limit}` : ''}
                  ${k.expires_at ? ` · До ${new Date(k.expires_at).toLocaleDateString('ru')}` : ' · Бессрочно'}
                  ${k.is_active ? '' : ' · <span style="color:var(--tg-destructive)">Отключён</span>'}
                </div>
              </div>
              ${k.is_active ? `<button class="header-btn" data-key="${esc(k.key)}" style="width:28px;height:28px;color:var(--tg-destructive)">${Icons.close}</button>` : ''}
            </div>`).join('')}
        </div>`;

      el.querySelectorAll('[data-key]').forEach(btn => {
        btn.addEventListener('click', async () => {
          confirmAction('Отключить ключ?', async () => {
            try {
              await API.post('/api/ai/disable_key', { key: btn.dataset.key });
              haptic('medium');
              toast('Ключ отключён');
              AdminScreen.loadKeys();
            } catch (e) { toast(e.message); }
          });
        });
      });
    } catch {}
  },
};
