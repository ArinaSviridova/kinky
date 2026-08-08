<template>
  <AppShell :party-slug="slug">
    <section v-if="party?.cover_url" class="party-banner">
      <img class="party-banner-img protected-media" :src="party.cover_url" alt="cover" />
    </section>

    <section class="hero" v-if="party">
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
    <section class="grid-3" v-if="party">
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

    <section class="content compact-content" v-if="party">
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
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppShell from '@/components/AppShell.vue';
import { api, post } from '@/lib/api';
import { applyTheme } from '@/lib/theme';
import { localized } from '@/lib/localized';
import { t } from '@/lib/i18n';
import { loadSession, resetSession } from '@/lib/session';

const route = useRoute();
const slug = String(route.params.slug);
const party = ref<any>(null);
const notificationsEnabled = ref(false);
const notificationsPending = ref(false);
const notificationLoading = ref(false);
const notificationError = ref('');

onMounted(async () => {
  const [partyData, session] = await Promise.all([
    api<{ party: any }>(`get-party?slug=${encodeURIComponent(slug)}`),
    loadSession(),
  ]);
  party.value = partyData.party;
  notificationsEnabled.value = Boolean(session.user?.telegram_notifications_enabled && session.user?.telegram_chat_id);
  applyTheme(partyData.party.theme || {});
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
