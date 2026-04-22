/* ═══════════════════════════════════════════════════
   CONFIG — единое место для всех настроек
   ═══════════════════════════════════════════════════ */

const Config = Object.freeze({
  /** Базовый URL вашего Go-бекенда */
  API_BASE: 'https://huggingface.co/spaces/Zynqochka/ssback-go',  // ← замените

  /** Акцентные цвета для кастомизации (hex) */
  ACCENT_COLORS: [
    '#2481cc', // TG Blue (default)
    '#1d9bf0', // Twitter Blue
    '#0088cc', // Classic TG
    '#27ae60', // Green
    '#8e44ad', // Purple
    '#e74c3c', // Red
    '#e67e22', // Orange
    '#16a085', // Teal
    '#2c3e50', // Dark
    '#c0392b', // Crimson
    '#6c5ce7', // Indigo
    '#fd79a8', // Pink
  ],

  /** Размеры шрифта */
  FONT_SIZES: [
    { label: 'Маленький', value: '14px' },
    { label: 'Обычный',   value: '16px' },
    { label: 'Большой',   value: '18px' },
  ],
});
