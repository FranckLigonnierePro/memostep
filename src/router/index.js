import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../components/HomeView.vue';
import ProfileView from '../components/ProfileView.vue';
import VersusView from '../components/VersusView.vue';
import BoardView from '../components/BoardView.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    meta: { showHeader: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfileView,
    meta: { showHeader: false }
  },
  {
    path: '/versus',
    name: 'Versus',
    component: VersusView,
    meta: { showHeader: false }
  },
  {
    path: '/game',
    name: 'Game',
    component: BoardView,
    meta: { showHeader: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
