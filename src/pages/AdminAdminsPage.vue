<template>
  <AppShell>
    <section class="content">
      <div class="card wide">
        <div class="section-head">
          <div>
            <h1>{{ t('adminsTitle') }}</h1>
            <p>{{ t('adminText') }}</p>
          </div>
          <RouterLink class="button secondary" to="/admin">{{ t('navAdmin') }}</RouterLink>
        </div>

        <form class="form-grid" @submit.prevent="addAdmin">
          <label>
            {{ t('adminIdentifier') }}
            <input v-model="identifier" required :placeholder="t('adminIdentifierPlaceholder')" />
          </label>
          <label>
            {{ t('adminRole') }}
            <select v-model="role">
              <option value="owner">owner</option>
              <option value="admin">admin</option>
              <option value="moderator">moderator</option>
              <option value="editor">editor</option>
            </select>
          </label>
          <button :disabled="loading">{{ t('addAdmin') }}</button>
        </form>

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="success" class="success">{{ t('saved') }}</p>

        <div class="table-card">
          <table>
            <thead>
              <tr><th>{{ t('displayName') }}</th><th>Email</th><th>Telegram</th><th>{{ t('adminRole') }}</th><th>{{ t('status') }}</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="admin in admins" :key="admin.id">
                <td>{{ admin.user?.display_name || '-' }}</td>
                <td>{{ admin.user?.google_email || '-' }}</td>
                <td>{{ admin.user?.telegram_username ? '@' + admin.user.telegram_username : '-' }}</td>
                <td>{{ admin.role }}</td>
                <td>{{ admin.is_active ? t('active') : t('closed') }}</td>
                <td><button class="danger small" type="button" @click="removeAdmin(admin.id)">{{ t('removeAdmin') }}</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import AppShell from '@/components/AppShell.vue';
import { api, post } from '@/lib/api';
import { t } from '@/lib/i18n';

const admins = ref<any[]>([]);
const identifier = ref('');
const role = ref('admin');
const loading = ref(false);
const error = ref('');
const success = ref(false);

async function load() {
  const data = await api<{ admins: any[] }>('admin-list-admins');
  admins.value = data.admins;
}

onMounted(async () => {
  try { await load(); } catch (e: any) { error.value = e.message; }
});

async function addAdmin() {
  loading.value = true;
  error.value = '';
  success.value = false;
  try {
    await post('admin-add-admin', { identifier: identifier.value, role: role.value });
    identifier.value = '';
    success.value = true;
    await load();
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function removeAdmin(adminId: string) {
  error.value = '';
  try {
    await post('admin-remove-admin', { adminId });
    await load();
  } catch (e: any) {
    error.value = e.message;
  }
}
</script>
