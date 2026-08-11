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

        <div class="role-help-grid">
          <div v-for="item in roleHelp" :key="item.role" class="role-help-card">
            <h3>{{ item.label }}</h3>
            <p>{{ item.description }}</p>
          </div>
        </div>

        <form class="form-grid" @submit.prevent="addAdmin">
          <label>
            {{ t('adminIdentifier') }}
            <input v-model="identifier" required :placeholder="t('adminIdentifierPlaceholder')" />
          </label>
          <label>
            {{ t('adminRole') }}
            <select v-model="role">
              <option v-for="option in roleOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </label>
          <button :disabled="loading">{{ t('addAdmin') }}</button>
        </form>

        <p class="muted-block">{{ t('adminUserNotFound') }}</p>
        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="success" class="success">{{ t('saved') }}</p>

        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>{{ t('displayName') }}</th>
                <th>Email</th>
                <th>Telegram</th>
                <th>{{ t('adminRole') }}</th>
                <th>{{ t('status') }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="admin in admins" :key="admin.id">
                <td>{{ admin.user?.display_name || (admin.is_pending ? t('pendingAdmin') : '-') }}</td>
                <td>{{ admin.user?.google_email || admin.pending_email || '-' }}</td>
                <td>{{ telegramLabel(admin) }}</td>
                <td>
                  <div class="inline-role-control">
                    <select v-model="admin.roleDraft" :aria-label="t('adminRole')">
                      <option v-for="option in roleOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                    </select>
                    <button
                      class="small secondary"
                      type="button"
                      :disabled="savingRoleId === admin.id || admin.roleDraft === admin.role"
                      @click="updateRole(admin)"
                    >
                      {{ t('updateRole') }}
                    </button>
                  </div>
                </td>
                <td>{{ admin.is_active ? (admin.is_pending ? t('pendingAdmin') : t('activeAdmin')) : t('closed') }}</td>
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
import { computed, onMounted, ref } from 'vue';
import AppShell from '@/components/AppShell.vue';
import { api, post } from '@/lib/api';
import { t } from '@/lib/i18n';
import { resetSession } from '@/lib/session';

const admins = ref<any[]>([]);
const identifier = ref('');
const role = ref('admin');
const loading = ref(false);
const savingRoleId = ref('');
const error = ref('');
const success = ref(false);

const roleOptions = computed(() => [
  { value: 'owner', label: t('roleOwner') },
  { value: 'admin', label: t('roleAdmin') },
  { value: 'moderator', label: t('roleModerator') },
  { value: 'editor', label: t('roleEditor') },
]);

const roleHelp = computed(() => [
  { role: 'owner', label: t('roleOwner'), description: t('roleOwnerDescription') },
  { role: 'admin', label: t('roleAdmin'), description: t('roleAdminDescription') },
  { role: 'moderator', label: t('roleModerator'), description: t('roleModeratorDescription') },
  { role: 'editor', label: t('roleEditor'), description: t('roleEditorDescription') },
]);

function withDraft(admin: any) {
  return { ...admin, roleDraft: admin.role };
}

function telegramLabel(admin: any) {
  const username = admin.user?.telegram_username || admin.pending_telegram_username;
  return username ? `@${String(username).replace(/^@/, '')}` : '-';
}

async function load() {
  const data = await api<{ admins: any[] }>('admin-list-admins');
  admins.value = data.admins.map(withDraft);
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
    resetSession();
    await load();
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function updateRole(admin: any) {
  savingRoleId.value = admin.id;
  error.value = '';
  success.value = false;
  try {
    await post('admin-update-admin-role', { adminId: admin.id, role: admin.roleDraft });
    success.value = true;
    resetSession();
    await load();
  } catch (e: any) {
    error.value = e.message;
  } finally {
    savingRoleId.value = '';
  }
}

async function removeAdmin(adminId: string) {
  error.value = '';
  success.value = false;
  try {
    await post('admin-remove-admin', { adminId });
    resetSession();
    await load();
  } catch (e: any) {
    error.value = e.message;
  }
}
</script>
