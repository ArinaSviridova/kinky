import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import './styles/main.css';
import { installPrivacyGuards } from './lib/privacyGuard';

import LoginPage from './pages/LoginPage.vue';
import AuthCallbackPage from './pages/AuthCallbackPage.vue';
import EnterKeyPage from './pages/EnterKeyPage.vue';
import PartyHomePage from './pages/PartyHomePage.vue';
import ProfileEditPage from './pages/ProfileEditPage.vue';
import ProfilesPage from './pages/ProfilesPage.vue';
import ProfileDetailsPage from './pages/ProfileDetailsPage.vue';
import MatchesPage from './pages/MatchesPage.vue';
import RulesPage from './pages/RulesPage.vue';
import AdminDashboardPage from './pages/AdminDashboardPage.vue';
import AdminPartyEditPage from './pages/AdminPartyEditPage.vue';
import AdminProfilesPage from './pages/AdminProfilesPage.vue';
import AdminReportsPage from './pages/AdminReportsPage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginPage },
    { path: '/auth/callback', component: AuthCallbackPage },
    { path: '/enter-key', component: EnterKeyPage },
    { path: '/party/:slug', component: PartyHomePage },
    { path: '/party/:slug/rules', component: RulesPage },
    { path: '/party/:slug/profile/edit', component: ProfileEditPage },
    { path: '/party/:slug/profiles', component: ProfilesPage },
    { path: '/party/:slug/profiles/:profileId', component: ProfileDetailsPage },
    { path: '/party/:slug/matches', component: MatchesPage },
    { path: '/admin', component: AdminDashboardPage },
    { path: '/admin/parties/new', component: AdminPartyEditPage },
    { path: '/admin/parties/:partyId', component: AdminPartyEditPage },
    { path: '/admin/parties/:partyId/profiles', component: AdminProfilesPage },
    { path: '/admin/parties/:partyId/reports', component: AdminReportsPage },
  ],
});

installPrivacyGuards();

createApp(App).use(router).mount('#app');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // PWA registration can fail on local HTTP. Naturally the browser has opinions.
    });
  });
}
