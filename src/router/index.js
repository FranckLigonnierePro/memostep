import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../components/HomeView.vue';
import ProfileView from '../components/ProfileView.vue';
import VersusView from '../components/VersusView.vue';
import BoardView from '../components/BoardView.vue';
import AuthCallback from '../components/AuthCallback.vue';
import LoginView from '../components/LoginView.vue';
import WelcomeView from '../components/WelcomeView.vue';
import { isAuthenticated } from '../lib/auth.js';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    meta: { showHeader: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { showHeader: false }
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: WelcomeView,
    meta: { showHeader: false }
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
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: AuthCallback,
    meta: { showHeader: false }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard: force /welcome when not authenticated and no local guest name
router.beforeEach(async (to) => {
  // Allowlist of routes that don't require profile or local username
  const allowlist = new Set(['Welcome', 'Login', 'AuthCallback']);

  // Determine auth state and local guest presence
  let authed = false;
  try { authed = await isAuthenticated(); } catch (_) { authed = false; }
  let hasLocal = false;
  try {
    const u = (localStorage.getItem('memostep_username') || '').trim();
    hasLocal = !!u;
  } catch (_) { hasLocal = false; }

  // If neither authenticated nor local guest, redirect to /welcome (except allowlist)
  if (!authed && !hasLocal && !allowlist.has(String(to.name))) {
    return { name: 'Welcome', replace: true };
  }

  // If already authenticated or has local guest, prevent staying on /welcome
  if ((authed || hasLocal) && String(to.name) === 'Welcome') {
    return { name: 'Home', replace: true };
  }

  // Otherwise proceed
  return true;
});

export default router;
