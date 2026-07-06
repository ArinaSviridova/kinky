<template>
  <AppShell>
    <section class="center-page">
      <div class="card narrow">
        <h1>{{ t('partyKeyTitle') }}</h1>
        <p>{{ t('partyKeyText') }}</p>
        <form @submit.prevent="enter">
          <label>
            {{ t('partyKeyLabel') }}
            <input v-model="key" :placeholder="t('partyKeyPlaceholder')" autocomplete="off" />
          </label>
          <button :disabled="loading">{{ t('enter') }}</button>
        </form>
        <p v-if="error" class="error">{{ error }}</p>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import AppShell from '@/components/AppShell.vue';
import { post } from '@/lib/api';
import { t } from '@/lib/i18n';

const router = useRouter();
const key = ref('');
const loading = ref(false);
const error = ref('');

async function enter() {
  loading.value = true;
  error.value = '';
  try {
    const data = await post<{ party: { slug: string } }>('enter-party', { key: key.value });
    router.push(`/party/${data.party.slug}`);
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>
