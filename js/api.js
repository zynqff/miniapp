/* ═══════════════════════════════════════════════════
   API — HTTP клиент с авто-рефрешем токена
   ═══════════════════════════════════════════════════ */

const API = {
  /** Основной метод запроса */
  async request(method, path, body = null, _retry = true) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (State.accessToken) {
      opts.headers['Authorization'] = `Bearer ${State.accessToken}`;
    }
    if (body !== null) {
      opts.body = JSON.stringify(body);
    }

    let res;
    try {
      res = await fetch(Config.API_BASE + path, opts);
    } catch (e) {
      throw new Error('Нет соединения с сервером');
    }

    // Авто-рефреш при 401
    if (res.status === 401 && _retry && State.refreshToken) {
      const ok = await API._refresh();
      if (ok) return API.request(method, path, body, false);
      // Рефреш не удался → переавторизация
      await API._reauth();
      return null;
    }

    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`;
      try {
        const json = await res.json();
        errMsg = json.error || errMsg;
      } catch {}
      throw new Error(errMsg);
    }

    // 204 No Content
    if (res.status === 204) return null;
    return res.json();
  },

  get:    (path)        => API.request('GET',    path),
  post:   (path, body)  => API.request('POST',   path, body),
  put:    (path, body)  => API.request('PUT',    path, body),
  del:    (path)        => API.request('DELETE', path),

  /** Обновление access-токена по refresh-токену */
  async _refresh() {
    if (!State.refreshToken) return false;
    try {
      const res = await fetch(Config.API_BASE + '/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: State.refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (!data.access_token) return false;
      State.accessToken  = data.access_token;
      State.refreshToken = data.refresh_token;
      Store.set('ss_access',  State.accessToken);
      Store.set('ss_refresh', State.refreshToken);
      return true;
    } catch {
      return false;
    }
  },

  /** Сброс токенов и повторный вход через TG */
  async _reauth() {
    State.accessToken  = null;
    State.refreshToken = null;
    State.me           = null;
    Store.del('ss_access');
    Store.del('ss_refresh');
    await TG.auth();
  },

  /** Авторизация через Telegram initData */
  async telegramAuth(initData, devUser = null) {
    const body = { init_data: initData };
    if (devUser) body.dev_user = devUser;

    const res = await fetch(Config.API_BASE + '/api/auth/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return res.json();
  },
};
