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
        <h1>{{ party.title }}</h1>
        <p>{{ party.description }}</p>
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
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppShell from '@/components/AppShell.vue';
import { api } from '@/lib/api';
import { applyTheme } from '@/lib/theme';
import { t } from '@/lib/i18n';

const route = useRoute();
const slug = String(route.params.slug);
const party = ref<any>(null);

onMounted(async () => {
  const data = await api<{ party: any }>(`get-party?slug=${encodeURIComponent(slug)}`);
  party.value = data.party;
  applyTheme(data.party.theme || {});
});
</script>
