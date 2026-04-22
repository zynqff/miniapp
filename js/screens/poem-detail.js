/* ═══════════════════════════════════════════════════
   SCREEN: poem-detail — просмотр стихотворения
   ═══════════════════════════════════════════════════ */

Router.register('poem-detail', {
  html: () => `
    <div class="app-header with-safe">
      <div class="header-back" id="poem-detail-back">${Icons.back} Назад</div>
      <div class="header-spacer"></div>
      <div class="header-right">
        <button class="header-btn" id="btn-poem-to-lib" title="В библиотеку">${Icons.home}</button>
      </div>
    </div>
    <div class="scroll-area" id="poem-detail-scroll">
      <div id="poem-detail-body"></div>
    </div>
  `,

  onMount() {
    document.getElementById('poem-detail-back').addEventListener('click', () => Router.pop());
    document.getElementById('btn-poem-to-lib').addEventListener('click', () => {
      if (!State.currentPoem) return;
      State.poemForLib = State.currentPoem;
      AddPoemScreen.open();
    });
    PoemDetailScreen.render();
  },
});

const PoemDetailScreen = {
  open(id) {
    const poem = State.poems.find(p => p.id === id);
    if (!poem) return;
    State.currentPoem = poem;
    Router.push('poem-detail');
  },

  render() {
    const poem   = State.currentPoem;
    const body   = document.getElementById('poem-detail-body');
    if (!poem || !body) return;

    const readSet = new Set(State.me?.read_poems || []);
    const isRead  = readSet.has(poem.id);
    const isPin   = State.me?.pinned_poem_id === poem.id;

    body.innerHTML = `
      <div class="poem-detail-meta">
        <div class="poem-detail-title">${esc(poem.title)}</div>
        <div class="poem-detail-author">${esc(poem.author)}</div>
        <div class="poem-detail-actions">
          <div class="action-row">
            <button class="action-btn ${isRead ? 'active' : ''}" id="btn-toggle-read">
              ${Icons.check} ${isRead ? 'Прочитано' : 'Отметить'}
            </button>
            <button class="action-btn ${isPin ? 'active' : ''}" id="btn-toggle-pin">
              ${Icons.pin} ${isPin ? 'Откреплено' : 'Закрепить'}
            </button>
            <button class="action-btn" id="btn-open-chat">
              ${Icons.chat} Обсудить
            </button>
          </div>
        </div>
      </div>
      <div class="poem-text-wrap">
        <div class="poem-full-text">${esc(poem.text)}</div>
      </div>`;

    document.getElementById('btn-toggle-read').addEventListener('click', () =>
      PoemDetailScreen.toggleRead(poem.id));
    document.getElementById('btn-toggle-pin').addEventListener('click', () =>
      PoemDetailScreen.togglePin(poem.id));
    document.getElementById('btn-open-chat').addEventListener('click', () =>
      ChatScreen.openWithPoem(poem));
  },

  async toggleRead(poemId) {
    if (!State.me) { toast('Нужна авторизация'); return; }
    try {
      await API.post('/api/toggle_read', { poem_id: poemId });
      const reads = State.me.read_poems || [];
      const idx   = reads.indexOf(poemId);
      if (idx >= 0) reads.splice(idx, 1); else reads.push(poemId);
      State.me.read_poems = reads;
      haptic('medium');
      PoemDetailScreen.render();
      PoemsScreen.renderCards();
    } catch (e) { toast(e.message); }
  },

  async togglePin(poemId) {
    if (!State.me) { toast('Нужна авторизация'); return; }
    try {
      const r = await API.post('/api/toggle_pin', { poem_id: poemId });
      State.me.pinned_poem_id = r?.pinned_poem_id ?? null;
      haptic('medium');
      PoemDetailScreen.render();
      ProfileScreen.render();
    } catch (e) { toast(e.message); }
  },
};
