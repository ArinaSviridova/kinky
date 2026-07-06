<template>
  <AppShell :party-slug="slug">
    <section class="content" v-if="profile">
      <div class="profile-detail card wide">
        <img class="detail-photo protected-media" :src="profile.photo_urls_signed?.[0] || '/kinky-logo.png'" :alt="profile.nickname" />
        <div>
          <h1>{{ profile.nickname }}</h1>
          <p class="preline">{{ profile.bio }}</p>
          <div class="tag-section">
            <h2>{{ t('detailsInterestedIn') }}</h2>
            <span v-for="item in labelsForValues(profile.interested_in)" :key="item" class="tag">{{ item }}</span>
          </div>
          <div class="tag-section">
            <h2>{{ t('detailsLookingFor') }}</h2>
            <span v-for="item in labelsForValues(profile.looking_for)" :key="item" class="tag">{{ item }}</span>
          </div>
          <div class="tag-section">
            <h2>{{ t('detailsApproach') }}</h2>
            <span v-for="item in labelsForValues(profile.approach_preferences)" :key="item" class="tag">{{ item }}</span>
          </div>
          <div class="tag-section">
            <h2>{{ t('detailsBoundaries') }}</h2>
            <span v-for="item in labelsForValues(profile.boundaries)" :key="item" class="tag">{{ item }}</span>
          </div>
          <p v-if="profile.icebreaker"><b>{{ t('icebreaker') }}:</b> {{ profile.icebreaker }}</p>
          <div class="action-row">
            <button @click="like" :disabled="liked">{{ liked ? t('likedSent') : t('interesting') }}</button>
            <button class="secondary" @click="report">{{ t('report') }}</button>
          </div>
          <p v-if="match" class="success">{{ t('matchTelegramOpen') }}</p>
          <p v-if="error" class="error">{{ error }}</p>
        </div>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppShell from '@/components/AppShell.vue';
import { api, post } from '@/lib/api';
import { applyTheme } from '@/lib/theme';
import { labelsForValues } from '@/lib/options';
import { t } from '@/lib/i18n';

const route = useRoute();
const slug = String(route.params.slug);
const profileId = String(route.params.profileId);
const party = ref<any>(null);
const profile = ref<any>(null);
const liked = ref(false);
const match = ref(false);
const error = ref('');

onMounted(async () => {
  const partyData = await api<{ party: any }>(`get-party?slug=${encodeURIComponent(slug)}`);
  party.value = partyData.party;
  applyTheme(party.value.theme || {});
  const data = await api<{ profile: any; liked: boolean; matched: boolean }>(`get-profile?partyId=${party.value.id}&profileId=${profileId}`);
  profile.value = data.profile;
  liked.value = data.liked;
  match.value = data.matched;
});

async function like() {
  error.value = '';
  try {
    const data = await post<{ matched: boolean }>('like-profile', { partyId: party.value.id, toProfileId: profileId });
    liked.value = true;
    match.value = data.matched;
  } catch (e: any) {
    error.value = e.message;
  }
}

async function report() {
  const details = prompt(t('reportPrompt'));
  if (!details) return;
  await post('report-profile', { partyId: party.value.id, reportedProfileId: profileId, reason: 'user_report', details });
  alert(t('reportSent'));
}
</script>
