import { createRouter, createWebHistory } from 'vue-router';
import CommentatorView from './views/CommentatorView.vue';
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
        path: '/commentator',
        component: CommentatorView
    },
    {
        path: '/commentator/tournament/:id',
        component: CommentatorView
    },
    {
        path: '/commentator/tournament/:id/round/:roundNumber',
        component: CommentatorView
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
