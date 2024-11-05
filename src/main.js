import { createApp } from 'vue';
import App from './App.vue';
import router from './router/router';
import { config } from "./config/config";

const app = createApp(App);
app.provide('config', config);
app.use(router);

app.mount('#app');
