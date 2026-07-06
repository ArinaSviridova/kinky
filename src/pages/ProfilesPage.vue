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

      <div v-if="profiles.length" class="profiles-grid">
        <ProfileCard v-for="profile in profiles" :key="profile.id" :profile="profile">
          <RouterLink class="button small" :to="`/party/${slug}/profiles/${profile.id}`">{{ t('open') }}</RouterLink>
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
import { api } from '@/lib/api';
import { applyTheme } from '@/lib/theme';
import { t } from '@/lib/i18n';

const route = useRoute();
const slug = String(route.params.slug);
const party = ref<any>(null);
const profiles = ref<any[]>([]);

onMounted(async () => {
  const partyData = await api<{ party: any }>(`get-party?slug=${encodeURIComponent(slug)}`);
  party.value = partyData.party;
  applyTheme(partyData.party.theme || {});

  const data = await api<{ profiles: any[] }>(`list-profiles?partyId=${party.value.id}`);
  profiles.value = data.profiles;
});
</script>
