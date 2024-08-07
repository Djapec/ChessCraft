import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';

const routes = [
    {
        path: '/tournament/:id',
        component: App
    },
    {
        path: '/tournament/:id/round/:roundNumber',
        component: App
    },
    {
        path: '/',
        component: App
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
