<template>
  <AppShell>
    <section class="content">
      <div class="section-head">
        <div>
          <h1>{{ t('adminTitle') }}</h1>
          <p>{{ t('adminText') }}</p>
        </div>
        <RouterLink class="button" to="/admin/parties/new">{{ t('createParty') }}</RouterLink>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <div class="table-card">
        <table>
          <thead>
            <tr><th>{{ t('partyName') }}</th><th>{{ t('start') }}</th><th>{{ t('accessClose') }}</th><th>{{ t('status') }}</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="party in parties" :key="party.id">
              <td>{{ party.title }}</td>
              <td>{{ new Date(party.starts_at).toLocaleString() }}</td>
              <td>{{ new Date(party.access_closes_at).toLocaleString() }}</td>
              <td>{{ party.is_active ? t('active') : t('closed') }}</td>
              <td class="actions-cell">
                <RouterLink :to="`/admin/parties/${party.id}`">{{ t('settings') }}</RouterLink>
                <RouterLink :to="`/admin/parties/${party.id}/profiles`">{{ t('profiles') }}</RouterLink>
                <RouterLink :to="`/admin/parties/${party.id}/reports`">{{ t('reports') }}</RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import AppShell from '@/components/AppShell.vue';
import { api } from '@/lib/api';
import { t } from '@/lib/i18n';

const parties = ref<any[]>([]);
const error = ref('');

onMounted(async () => {
  try {
    const data = await api<{ parties: any[] }>('admin-list-parties');
    parties.value = data.parties;
  } catch (e: any) {
    error.value = e.message;
  }
});
</script>
