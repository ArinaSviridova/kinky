<template>
  <AppShell>
    <section class="content">
      <h1>{{ t('reportsTitle') }}</h1>
      <p v-if="error" class="error">{{ error }}</p>
      <div class="table-card">
        <table>
          <thead>
            <tr><th>{{ t('reportedUser') }}</th><th>{{ t('reason') }}</th><th>{{ t('details') }}</th><th>{{ t('status') }}</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="report in reports" :key="report.id">
              <td>{{ report.reported?.nickname || report.reported_profile_id }}</td>
              <td>{{ report.reason }}</td>
              <td>{{ report.details }}</td>
              <td>{{ report.status }}</td>
              <td><button class="secondary small" @click="markDone(report.id)">{{ t('done') }}</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppShell from '@/components/AppShell.vue';
import { api, post } from '@/lib/api';
import { t } from '@/lib/i18n';

const route = useRoute();
const partyId = String(route.params.partyId);
const reports = ref<any[]>([]);
const error = ref('');

async function load() {
  const data = await api<{ reports: any[] }>(`admin-list-reports?partyId=${partyId}`);
  reports.value = data.reports;
}

onMounted(async () => {
  try { await load(); } catch (e: any) { error.value = e.message; }
});

async function markDone(reportId: string) {
  await post('admin-update-report', { reportId, status: 'done' });
  await load();
}
</script>
