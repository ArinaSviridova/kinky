<template>
  <AppShell :party-slug="slug">
    <section class="content" v-if="party">
      <div class="card">
        <h1>{{ t('rules') }}</h1>
        <p class="preline">{{ party.rules_text || t('rulesEmpty') }}</p>
      </div>
      <div class="card">
        <h1>{{ t('dressCode') }}</h1>
        <p class="preline">{{ party.dress_code_text || t('dressCodeEmpty') }}</p>
        <div v-if="party.pinterest_links?.length" class="link-list">
          <a v-for="link in party.pinterest_links" :key="link" :href="link" target="_blank" rel="noreferrer">{{ t('pinterestReference') }}</a>
        </div>
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
