<template>
  <AppShell :party-slug="slug">
    <section v-if="loading" class="content compact-content">
      <div class="card">
        <h1>{{ t('loading') }}</h1>
        <p>{{ t('loadingParty') }}</p>
      </div>
    </section>

    <section v-else-if="error" class="content compact-content">
      <div class="card">
        <h1>{{ t('partyLoadFailedTitle') }}</h1>
        <p class="error">{{ error }}</p>
        <div class="action-row">
          <RouterLink class="button" to="/enter-key">{{ t('navApp') }}</RouterLink>
          <RouterLink v-if="isAdmin" class="button secondary" to="/admin">{{ t('navAdmin') }}</RouterLink>
        </div>
      </div>
    </section>

    <template v-else-if="party">
      <section v-if="party.cover_url" class="party-banner">
        <img class="party-banner-img protected-media" :src="party.cover_url" alt="cover" />
      </section>

      <section class="hero">
        <div class="hero-logo-wrap">
          <img class="hero-logo protected-media" :src="party.logo_url || '/kinky-logo.png'" alt="logo" />
        </div>
        <div>
          <p class="eyebrow">{{ t('closedPreParty') }}</p>
          <h1>{{ localized(party, 'title') }}</h1>
          <p>{{ localized(party, 'description') }}</p>
          <div class="action-row">
            <RouterLink class="button" :to="`/party/${slug}/profile/edit`">{{ t('myProfile') }}</RouterLink>
            <RouterLink class="button secondary" :to="`/party/${slug}/profiles`">{{ t('viewProfiles') }}</RouterLink>
            <RouterLink class="button ghost" :to="`/party/${slug}/rules`">{{ t('rulesAndDressCode') }}</RouterLink>
          </div>
        </div>
      </section>
      <section class="grid-3">
        <div class="card">
          <h2>{{ t('beforePartyTitle') }}</h2>
          <p>{{ t('beforePartyText') }}</p>
        </div>
        <div class="card">
          <h2>{{ t('telegramHiddenTitle') }}</h2>
          <p>{{ t('telegramHiddenText') }}</p>
        </div>
        <div class="card">
          <h2>{{ t('after48Title') }}</h2>
          <p>{{ t('after48Text') }}</p>
        </div>
      </section>

      <section class="content compact-content">
        <PwaInstallGuide />
        <div class="card notification-card">
          <div>
            <h2>{{ t('telegramNotificationsTitle') }}</h2>
            <p>{{ t('telegramNotificationsText') }}</p>
            <p v-if="notificationsPending" class="success">{{ t('telegramNotificationsPending') }}</p>
            <p v-if="notificationError" class="error">{{ notificationError }}</p>
          </div>
          <button
            v-if="!notificationsEnabled"
            type="button"
            class="secondary"
            :disabled="notificationLoading"
            @click="connectTelegramNotifications"
          >
            {{ t('telegramNotificationsConnect') }}
          </button>
          <span v-else class="badge success-badge">{{ t('telegramNotificationsOn') }}</span>
        </div>
      </section>
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppShell from '@/components/AppShell.vue';
import PwaInstallGuide from '@/components/PwaInstallGuide.vue';
import { api, post } from '@/lib/api';
import { applyTheme } from '@/lib/theme';
import { localized } from '@/lib/localized';
import { t } from '@/lib/i18n';
import { loadSession, resetSession } from '@/lib/session';

const route = useRoute();
const slug = String(route.params.slug);
const party = ref<any>(null);
const loading = ref(true);
const error = ref('');
const isAdmin = ref(false);
const notificationsEnabled = ref(false);
const notificationsPending = ref(false);
const notificationLoading = ref(false);
const notificationError = ref('');

onMounted(async () => {
  document.body.classList.remove('privacy-blur');
  try {
    const [partyData, session] = await Promise.all([
      api<{ party: any }>(`get-party?slug=${encodeURIComponent(slug)}`),
      loadSession(),
    ]);
    party.value = partyData.party;
    isAdmin.value = session.isAdmin;
    notificationsEnabled.value = Boolean(session.user?.telegram_notifications_enabled && session.user?.telegram_chat_id);
    applyTheme(partyData.party.theme || {});
  } catch (e: any) {
    error.value = e.message || t('partyLoadFailedText');
  } finally {
    document.body.classList.remove('privacy-blur');
    loading.value = false;
  }
});

async function connectTelegramNotifications() {
  notificationLoading.value = true;
  notificationError.value = '';
  notificationsPending.value = false;
  try {
    const data = await post<{ url: string }>('telegram-create-link', {});
    notificationsPending.value = true;
    resetSession();
    window.location.href = data.url;
  } catch (e: any) {
    notificationError.value = e.message;
  } finally {
    notificationLoading.value = false;
  }
}
</script>
