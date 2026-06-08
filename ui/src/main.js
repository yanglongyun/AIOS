import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./style.css";
import { useThemeStore } from "./stores/theme.js";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
useThemeStore(pinia);
app.mount("#app");
