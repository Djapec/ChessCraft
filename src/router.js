import { createRouter, createWebHistory } from 'vue-router';
import Admin from './views/CommentatorView.vue';
import UserView from "./views/UserView.vue";

const routes = [
    // {
    //     path: '/tournament/:id',
    //     component: App
    // },
    // {
    //     path: '/tournament/:id/round/:roundNumber',
    //     component: App
    // },
    {
        path: '/admin',
        component: Admin
    },
    {
        path: '/',
        component: UserView
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
