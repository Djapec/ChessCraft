import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router/router';
import { config } from "./config/config";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

app.provide('config', config);
app.use(router);

app.mount('#app');
