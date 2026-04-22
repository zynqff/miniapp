/* ═══════════════════════════════════════════════════
   ROUTER — стек экранов, навигация
   ═══════════════════════════════════════════════════ */

const Router = {
  /** Зарегистрированные экраны: id → { html(), onMount(), onUnmount() } */
  _screens: {},
  /** Текущий стек: ['main', 'poem', ...] */
  _stack: [],

  /** Регистрирует экран */
  register(id, def) {
    this._screens[id] = def;
  },

  /** Монтирует DOM всех экранов в #screens-container */
  mountAll() {
    const container = document.getElementById('screens-container');
    for (const [id, def] of Object.entries(this._screens)) {
      const div = document.createElement('div');
      div.id = `screen-${id}`;
      div.className = 'screen state-hidden';
      div.innerHTML = def.html();
      container.appendChild(div);
    }
  },

  /** Показывает стартовый экран */
  start(id = 'main') {
    this._stack = [id];
    this._applyState(id, 'state-active');
  },

  /** Переходит на экран (push) */
  push(id, params = {}) {
    haptic('light');
    const prev = this._current();

    if (prev) {
      this._applyState(prev, 'state-exit-active');
      setTimeout(() => this._applyState(prev, 'state-exited'), 280);
    }

    this._stack.push(id);
    const el = this._el(id);
    this._applyState(id, 'state-entering');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this._applyState(id, 'state-enter-active');
        setTimeout(() => {
          this._applyState(id, 'state-active');
          this._screens[id]?.onMount?.(params);
        }, 280);
      });
    });
  },

  /** Возврат на предыдущий экран (pop) */
  pop() {
    if (this._stack.length <= 1) return;
    haptic('light');

    const current = this._stack.pop();
    const prev    = this._current();

    // Анимируем текущий вперёд-уходящий
    this._applyState(current, 'state-entering'); // translateX(100%)
    setTimeout(() => {
      this._screens[current]?.onUnmount?.();
      this._applyState(current, 'state-hidden');
    }, 280);

    // Возвращаем предыдущий
    if (prev) {
      this._applyState(prev, 'state-enter-active');
      setTimeout(() => this._applyState(prev, 'state-active'), 280);
    }
  },

  /** Текущий ID экрана */
  _current() {
    return this._stack[this._stack.length - 1] || null;
  },

  /** DOM-элемент экрана */
  _el(id) {
    return document.getElementById(`screen-${id}`);
  },

  /** Переключает state-классы */
  _applyState(id, state) {
    const el = this._el(id);
    if (!el) return;
    el.className = el.className
      .replace(/\bstate-\S+/g, '')
      .trim() + ' ' + state;
  },
};
