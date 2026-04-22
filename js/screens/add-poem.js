/* ═══════════════════════════════════════════════════
   SCREEN: add-poem — добавление стиха в библиотеку
   ═══════════════════════════════════════════════════ */

Router.register('add-poem', {
  html: () => `
    <div class="app-header with-safe">
      <div class="header-back" id="addpoem-back">${Icons.back} Назад</div>
      <div class="header-title">В библиотеку</div>
      <div class="header-right"></div>
    </div>
    <div class="scroll-area" id="addpoem-scroll">
      <div id="addpoem-body" style="padding-bottom:32px"></div>
    </div>
  `,

  onMount() {
    document.getElementById('addpoem-back').addEventListener('click', () => Router.pop());
    AddPoemScreen.render();
  },
});

const AddPoemScreen = {
  open() {
    Router.push('add-poem');
  },

  render() {
    const poem = State.poemForLib;
    const el   = document.getElementById('addpoem-body');
    if (!el) return;

    el.innerHTML = `
      <!-- Из каталога -->
      <div class="section-header" style="padding-top:16px">Добавить из каталога</div>
      <div class="section-block">
        ${poem ? `
        <div class="poem-card" style="cursor:default">
          <div class="poem-title">${esc(poem.title)}</div>
          <div class="poem-author">${esc(poem.author)}</div>
        </div>` : ''}
        <div style="padding:12px 16px">
          <button class="btn-primary" id="btn-add-catalog"${!poem ? ' disabled' : ''}>
            Добавить «${esc(poem?.title || '—')}»
          </button>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Свой стих -->
      <div class="section-header">Или добавить свой стих</div>
      <div class="section-block">
        <div class="form-group">
          <div class="input-label">Название *</div>
          <input class="input-field" id="custom-title" placeholder="Название стиха" maxlength="200">
        </div>
        <div class="form-group">
          <div class="input-label">Автор *</div>
          <input class="input-field" id="custom-author" placeholder="Имя автора" maxlength="200">
        </div>
        <div class="form-group">
          <div class="input-label">Текст *</div>
          <textarea class="input-field" id="custom-text" rows="7" placeholder="Введите текст стиха…" style="resize:vertical"></textarea>
        </div>
        <div style="padding:4px 16px 16px">
          <button class="btn-primary btn-secondary" id="btn-add-custom">Добавить свой стих</button>
        </div>
      </div>`;

    document.getElementById('btn-add-catalog')?.addEventListener('click', async () => {
      if (!poem) return;
      try {
        await API.post('/api/library/mine/poems', { poem_id: poem.id });
        haptic('success');
        toast('Добавлено в библиотеку');
        LibraryScreen._loaded = false;
        Router.pop();
      } catch (e) { toast(e.message); }
    });

    document.getElementById('btn-add-custom')?.addEventListener('click', async () => {
      const title  = document.getElementById('custom-title').value.trim();
      const author = document.getElementById('custom-author').value.trim();
      const text   = document.getElementById('custom-text').value.trim();
      if (!title || !author || !text) { toast('Заполните все поля'); return; }
      try {
        await API.post('/api/library/mine/poems', {
          custom_title: title, custom_author: author, custom_text: text,
        });
        haptic('success');
        toast('Стих добавлен');
        LibraryScreen._loaded = false;
        Router.pop();
      } catch (e) { toast(e.message); }
    });
  },
};
