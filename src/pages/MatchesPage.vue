<template>
  <AppShell :party-slug="slug">
    <section class="content">
      <h1>{{ t('matchesTitle') }}</h1>
      <p>{{ t('matchesText') }}</p>
      <div v-if="matches.length" class="profiles-grid">
        <ProfileCard v-for="profile in matches" :key="profile.id" :profile="profile">
          <a v-if="profile.telegram_username" class="button small" :href="`https://t.me/${String(profile.telegram_username).replace('@', '')}`" target="_blank" rel="noreferrer">{{ t('openTelegram') }}</a>
        </ProfileCard>
      </div>
      <div v-else class="card">
        <h2>{{ t('noMatchesTitle') }}</h2>
        <p>{{ t('noMatchesText') }}</p>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppShell from '@/components/AppShell.vue';
import ProfileCard from '@/components/ProfileCard.vue';
import { api } from '@/lib/api';
import { applyTheme } from '@/lib/theme';
import { t } from '@/lib/i18n';

const route = useRoute();
const slug = String(route.params.slug);
const party = ref<any>(null);
const matches = ref<any[]>([]);

onMounted(async () => {
  const data = await api<{ party: any; matches: any[] }>(`list-matches?slug=${encodeURIComponent(slug)}`);
  party.value = data.party;
  matches.value = data.matches;
  applyTheme(data.party.theme || {});
});
</script>
