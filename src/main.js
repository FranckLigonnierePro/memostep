import { createApp } from 'vue';
import App from './App.vue';
import './styles/tailwind.css';
import i18n from './i18n.js';
import router from './router/index.js';

createApp(App)
  .use(i18n)
  .use(router)
  .mount('#app');
