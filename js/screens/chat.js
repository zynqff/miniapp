/* ═══════════════════════════════════════════════════
   SCREEN: chat — AI-чат про стихи
   ═══════════════════════════════════════════════════ */

Router.register('chat', {
  html: () => `
    <div class="app-header with-safe">
      <div class="header-back" id="chat-back">${Icons.back} Назад</div>
      <div class="header-title">AI-помощник</div>
      <div class="header-right">
        <button class="header-btn" id="btn-chat-clear" title="Очистить">${Icons.trash}</button>
      </div>
    </div>
    <div class="chat-messages" id="chat-messages"></div>
    <div class="chat-input-row">
      <textarea class="chat-textarea" id="chat-input" placeholder="Спросите про стихи…" rows="1"></textarea>
      <button class="chat-send-btn" id="chat-send" disabled>
        ${Icons.send}
      </button>
    </div>
  `,

  onMount() {
    document.getElementById('chat-back').addEventListener('click', () => Router.pop());
    document.getElementById('btn-chat-clear').addEventListener('click', () => {
      confirmAction('Очистить историю чата?', () => {
        State.chatMessages = [];
        ChatScreen.renderMessages();
      });
    });

    const input   = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');

    input.addEventListener('input', () => {
      // Авторесайз
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 96) + 'px';
      sendBtn.disabled = !input.value.trim() || State.chatLoading;
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        ChatScreen.send();
      }
    });

    sendBtn.addEventListener('click', () => ChatScreen.send());

    ChatScreen.renderMessages();
  },
});

const ChatScreen = {
  open() {
    Router.push('chat');
  },

  openWithPoem(poem) {
    // Предзаполняем инпут вопросом о стихе
    Router.push('chat');
    // onMount отработает, потом вставляем текст
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const input = document.getElementById('chat-input');
        if (!input) return;
        input.value = `Расскажи о стихотворении «${poem.title}» (${poem.author}). Что оно означает и какова его идея?`;
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 96) + 'px';
        document.getElementById('chat-send').disabled = false;
        input.focus();
      });
    });
  },

  async send() {
    const input   = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    if (!input) return;

    const text = input.value.trim();
    if (!text || State.chatLoading) return;

    State.chatMessages.push({ role: 'user', content: text, time: new Date() });
    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;
    haptic('light');

    this.renderMessages();
    this._showTyping();

    State.chatLoading = true;
    try {
      const r = await API.post('/api/ai/chat', { prompt: text });
      State.chatMessages.push({ role: 'assistant', content: r.response, time: new Date() });
    } catch (e) {
      State.chatMessages.push({
        role: 'assistant',
        content: `Ошибка: ${e.message}`,
        time: new Date(),
        isError: true,
      });
    }
    State.chatLoading = false;
    this.renderMessages();
  },

  renderMessages() {
    const el = document.getElementById('chat-messages');
    if (!el) return;

    if (!State.chatMessages.length) {
      el.innerHTML = `
        <div class="chat-empty">
          <div class="chat-empty-icon">✨</div>
          Спросите об авторах, стихах<br>или их значении
        </div>`;
      return;
    }

    el.innerHTML = State.chatMessages.map(m => `
      <div class="msg ${m.role} fade-in">
        <div class="msg-bubble" style="${m.isError ? 'opacity:.6' : ''}">${esc(m.content)}</div>
        <div class="msg-time">${formatTime(m.time)}</div>
      </div>`).join('');

    el.scrollTop = el.scrollHeight;
  },

  _showTyping() {
    const el = document.getElementById('chat-messages');
    if (!el) return;
    const div = document.createElement('div');
    div.className = 'msg assistant';
    div.id = 'typing-indicator';
    div.innerHTML = `
      <div class="msg-bubble">
        <div class="typing-bubble">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  },
};
