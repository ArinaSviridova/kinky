<template>
  <AppShell>
    <section class="content">
      <h1>{{ t('eventProfiles') }}</h1>
      <p v-if="error" class="error">{{ error }}</p>
      <div class="table-card">
        <table>
          <thead>
            <tr><th>{{ t('photoTable') }}</th><th>{{ t('nicknameTable') }}</th><th>Telegram</th><th>{{ t('status') }}</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="profile in profiles" :key="profile.id">
              <td><img class="table-photo protected-media" :src="profile.photo_urls_signed?.[0] || '/kinky-logo.png'" /></td>
              <td>{{ profile.nickname }}</td>
              <td>@{{ profile.telegram_username }}</td>
              <td>{{ profile.is_blocked ? t('blocked') : profile.is_visible ? t('visible') : t('hidden') }}</td>
              <td class="actions-cell">
                <button class="secondary small" @click="setVisibility(profile.id, !profile.is_visible)">{{ profile.is_visible ? t('hide') : t('show') }}</button>
                <button class="danger small" @click="block(profile.id)">{{ t('block') }}</button>
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
import { useRoute } from 'vue-router';
import AppShell from '@/components/AppShell.vue';
import { api, post } from '@/lib/api';
import { t } from '@/lib/i18n';

const route = useRoute();
const partyId = String(route.params.partyId);
const profiles = ref<any[]>([]);
const error = ref('');

async function load() {
  const data = await api<{ profiles: any[] }>(`admin-list-profiles?partyId=${partyId}`);
  profiles.value = data.profiles;
}

onMounted(async () => {
  try { await load(); } catch (e: any) { error.value = e.message; }
});

async function setVisibility(profileId: string, isVisible: boolean) {
  await post('admin-update-profile-status', { profileId, is_visible: isVisible });
  await load();
}

async function block(profileId: string) {
  await post('admin-update-profile-status', { profileId, is_blocked: true, is_visible: false });
  await load();
}
</script>
