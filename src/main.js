import { createApp } from 'vue';
import App from './App.vue';
import './styles/tailwind.css';
import i18n from './i18n.js';

createApp(App)
  .use(i18n)
  .mount('#app');
