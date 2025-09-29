import { createI18n } from 'vue-i18n';
import fr from './locales/fr.json';
import en from './locales/en.json';
import es from './locales/es.json';
import de from './locales/de.json';

const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('locale') : null;
const browser = typeof navigator !== 'undefined' ? (navigator.language || navigator.userLanguage || 'fr') : 'fr';
const fallback = 'fr';
const initial = stored || browser.slice(0, 2) || fallback;

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: ['fr', 'en', 'es', 'de'].includes(initial) ? initial : fallback,
  fallbackLocale: fallback,
  messages: { fr, en, es, de },
});

export default i18n;
