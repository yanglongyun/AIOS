import { createApp } from 'vue';
import App from './App.vue';
import './style.css';
import { router } from './router.ts';

const app = createApp(App);
app.use(router).mount('#app');
