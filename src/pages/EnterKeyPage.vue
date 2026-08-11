<template>
  <AppShell>
    <section class="center-page">
      <div class="card narrow">
        <h1>{{ t('partyKeyTitle') }}</h1>
        <p>{{ t('partyKeyText') }}</p>

        <div v-if="parties.length" class="saved-parties">
          <h2>{{ t('availableParties') }}</h2>
          <RouterLink v-for="party in parties" :key="party.id" class="button secondary full-button" :to="`/party/${party.slug}`">
            {{ localized(party, 'title') || party.title }}
          </RouterLink>
        </div>

        <form @submit.prevent="enter">
          <label>
            {{ t('partyKeyLabel') }}
            <input v-model="key" :placeholder="t('partyKeyPlaceholder')" autocomplete="off" />
          </label>
          <button :disabled="loading">{{ t('enter') }}</button>
        </form>
        <p v-if="error" class="error">{{ error }}</p>
      </div>
      <PwaInstallGuide />
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppShell from '@/components/AppShell.vue';
import PwaInstallGuide from '@/components/PwaInstallGuide.vue';
import { api, post } from '@/lib/api';
import { localized } from '@/lib/localized';
import { t } from '@/lib/i18n';

const router = useRouter();
const key = ref('');
const loading = ref(false);
const error = ref('');
const parties = ref<any[]>([]);

onMounted(async () => {
  try {
    const data = await api<{ parties: any[] }>('list-my-parties');
    parties.value = data.parties;
    if (data.parties.length === 1) router.replace(`/party/${data.parties[0].slug}`);
  } catch {
    router.replace('/login');
  }
});

async function enter() {
  loading.value = true;
  error.value = '';
  try {
    const data = await post<{ party: { slug?: string } }>('enter-party', { key: key.value.trim() });
    if (!data.party?.slug) throw new Error(t('partyLoadFailedText'));
    document.body.classList.remove('privacy-blur');
    router.push(`/party/${data.party.slug}`);
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>
