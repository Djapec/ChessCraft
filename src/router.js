import { createRouter, createWebHistory } from 'vue-router';
import Admin from './views/CommentatorView.vue';
import UserView from "./views/UserView.vue";

const routes = [
    {
        path: '/tournament/:id',
        component: UserView
    },
    {
        path: '/tournament/:id/round/:roundNumber',
        component: UserView
    },
    {
        path: '/admin',
        component: Admin
    },
    {
        path: '/admin/tournament/:id',
        component: Admin
    },
    {
        path: '/admin/tournament/:id/round/:roundNumber',
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
