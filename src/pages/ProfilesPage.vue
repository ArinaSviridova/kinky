<template>
  <AppShell :party-slug="slug">
    <section class="content">
      <div class="section-head">
        <div>
          <h1>{{ t('profilesTitle') }}</h1>
          <p>{{ t('profilesText') }}</p>
        </div>
        <RouterLink class="button secondary" :to="`/party/${slug}/profile/edit`">{{ t('myProfile') }}</RouterLink>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <div v-if="loading" class="card">{{ t('profilesTitle') }}...</div>

      <div v-else-if="profiles.length" class="profiles-grid">
        <ProfileCard v-for="profile in profiles" :key="profile.id" :profile="profile">
          <RouterLink class="button small" :to="`/party/${slug}/profiles/${profile.id}`">
            {{ profile.isMine ? t('view') : t('open') }}
          </RouterLink>
          <button
            v-if="!profile.isMine"
            class="secondary small"
            type="button"
            :disabled="profile.isLikedByMe || likingId === profile.id"
            @click="like(profile)"
          >
            {{ profile.isLikedByMe ? t('likedSent') : t('match') }}
          </button>
        </ProfileCard>
      </div>
      <div v-else class="card">
        <h2>{{ t('noProfilesTitle') }}</h2>
        <p>{{ t('noProfilesText') }}</p>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppShell from '@/components/AppShell.vue';
import ProfileCard from '@/components/ProfileCard.vue';
import { api, post } from '@/lib/api';
import { applyTheme } from '@/lib/theme';
import { t } from '@/lib/i18n';

const route = useRoute();
const slug = String(route.params.slug);
const party = ref<any>(null);
const profiles = ref<any[]>([]);
const loading = ref(true);
const error = ref('');
const likingId = ref('');

async function load() {
  const data = await api<{ party: any; profiles: any[] }>(`list-profiles?slug=${encodeURIComponent(slug)}`);
  party.value = data.party;
  profiles.value = data.profiles;
  applyTheme(data.party.theme || {});
}

onMounted(async () => {
  try {
    await load();
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});

async function like(profile: any) {
  error.value = '';
  likingId.value = profile.id;
  try {
    const data = await post<{ matched: boolean }>('like-profile', { partyId: party.value.id, toProfileId: profile.id });
    profile.isLikedByMe = true;
    profile.isMatched = data.matched;
  } catch (e: any) {
    error.value = e.message;
  } finally {
    likingId.value = '';
  }
}
</script>
