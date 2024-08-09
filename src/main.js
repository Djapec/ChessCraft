import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { config } from "./config";

const app = createApp(App);
app.provide('config', config);
app.use(router);

app.mount('#app');
