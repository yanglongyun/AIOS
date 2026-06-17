import { createApp } from 'vue';
import App from './App.vue';
import { loadAppearance } from './lib/appearance.js';
import './style.css';

loadAppearance().finally(() => {
  createApp(App).mount('#app');
});
