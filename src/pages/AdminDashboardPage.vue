<template>
  <AppShell>
    <section class="content">
      <div class="section-head">
        <div>
          <h1>{{ t('adminTitle') }}</h1>
          <p>{{ t('adminText') }}</p>
        </div>
        <div class="action-row">
          <RouterLink class="button secondary" to="/enter-key">{{ t('navApp') }}</RouterLink>
          <RouterLink class="button secondary" to="/admin/admins">{{ t('admins') }}</RouterLink>
          <RouterLink class="button" to="/admin/parties/new">{{ t('createParty') }}</RouterLink>
        </div>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <div class="table-card">
        <table>
          <thead>
            <tr><th>{{ t('partyName') }}</th><th>{{ t('start') }}</th><th>{{ t('accessClose') }}</th><th>{{ t('status') }}</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="party in parties" :key="party.id">
              <td>{{ localized(party, 'title') || party.title }}</td>
              <td>{{ new Date(party.starts_at).toLocaleString() }}</td>
              <td>{{ new Date(party.access_closes_at).toLocaleString() }}</td>
              <td>{{ party.is_active ? t('active') : t('closed') }}</td>
              <td class="actions-cell">
                <RouterLink :to="`/admin/parties/${party.id}`">{{ t('settings') }}</RouterLink>
                <RouterLink :to="`/admin/parties/${party.id}/profiles`">{{ t('profiles') }}</RouterLink>
                <RouterLink :to="`/admin/parties/${party.id}/reports`">{{ t('reports') }}</RouterLink>
                <RouterLink :to="`/party/${party.slug}`">{{ t('navApp') }}</RouterLink>
                <button class="danger small" type="button" @click="deleteParty(party)">{{ t('deleteParty') }}</button>
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
import { api, post } from '@/lib/api';
import { localized } from '@/lib/localized';
import { t } from '@/lib/i18n';

const parties = ref<any[]>([]);
const error = ref('');

async function load() {
  const data = await api<{ parties: any[] }>('admin-list-parties');
  parties.value = data.parties;
}

onMounted(async () => {
  try {
    await load();
  } catch (e: any) {
    error.value = e.message;
  }
});

async function deleteParty(party: any) {
  if (!confirm(t('deletePartyConfirm'))) return;
  error.value = '';
  try {
    await post('admin-close-party', { partyId: party.id });
    parties.value = parties.value.filter((item) => item.id !== party.id);
  } catch (e: any) {
    error.value = e.message;
  }
}
</script>
