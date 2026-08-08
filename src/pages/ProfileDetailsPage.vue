<template>
  <AppShell :party-slug="slug">
    <section class="content" v-if="profile">
      <div class="profile-detail card wide">
        <div class="detail-gallery">
          <img
            v-for="photo in photos"
            :key="photo"
            class="detail-photo protected-media"
            loading="lazy"
            :src="photo"
            :alt="profile.nickname"
          />
        </div>
        <div>
          <div class="title-row">
            <h1>{{ profile.nickname }}</h1>
            <span v-if="profile.isMine" class="badge">{{ t('myProfileBadge') }}</span>
            <span v-else-if="match" class="badge success-badge">{{ t('matched') }}</span>
          </div>
          <p class="preline">{{ localized(profile, 'bio') }}</p>

          <div class="tag-section">
            <h2>{{ t('detailsInterestedIn') }}</h2>
            <span v-for="item in labelsForValues(profile.interested_in)" :key="item" class="tag">{{ item }}</span>
          </div>
          <div class="tag-section">
            <h2>{{ t('detailsLookingFor') }}</h2>
            <span v-for="item in labelsForValues(profile.looking_for)" :key="item" class="tag">{{ item }}</span>
            <p v-if="localized(profile, 'looking_for_text')" class="preline muted-block">{{ localized(profile, 'looking_for_text') }}</p>
          </div>
          <div class="tag-section">
            <h2>{{ t('detailsApproach') }}</h2>
            <span v-for="item in labelsForValues(profile.approach_preferences)" :key="item" class="tag">{{ item }}</span>
            <p v-if="localized(profile, 'approach_text')" class="preline muted-block">{{ localized(profile, 'approach_text') }}</p>
          </div>
          <div class="tag-section">
            <h2>{{ t('detailsBoundaries') }}</h2>
            <span v-for="item in labelsForValues(profile.boundaries)" :key="item" class="tag">{{ item }}</span>
            <p v-if="localized(profile, 'boundaries_text')" class="preline muted-block">{{ localized(profile, 'boundaries_text') }}</p>
          </div>
          <p v-if="localized(profile, 'icebreaker')"><b>{{ t('icebreaker') }}:</b> {{ localized(profile, 'icebreaker') }}</p>

          <div v-if="!profile.isMine" class="action-row">
            <button @click="like" :disabled="match || liked || loadingLike">{{ match ? t('matched') : liked ? t('likedSent') : t('match') }}</button>
            <button class="secondary" @click="report">{{ t('report') }}</button>
          </div>
          <RouterLink v-else class="button secondary" :to="`/party/${slug}/profile/edit`">{{ t('editProfile') }}</RouterLink>
          <div v-if="match" class="match-contact-box">
            <p class="success">{{ t('matchTelegramOpen') }}</p>
            <a
              v-if="profile.telegram_username"
              class="button small"
              :href="`https://t.me/${String(profile.telegram_username).replace('@', '')}`"
              target="_blank"
              rel="noreferrer"
            >
              {{ t('openTelegram') }}
            </a>
          </div>
          <p v-if="error" class="error">{{ error }}</p>
        </div>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppShell from '@/components/AppShell.vue';
import { api, post } from '@/lib/api';
import { applyTheme } from '@/lib/theme';
import { labelsForValues } from '@/lib/options';
import { localized } from '@/lib/localized';
import { t } from '@/lib/i18n';

const route = useRoute();
const slug = String(route.params.slug);
const profileId = String(route.params.profileId);
const party = ref<any>(null);
const profile = ref<any>(null);
const liked = ref(false);
const match = ref(false);
const loadingLike = ref(false);
const error = ref('');
const photos = computed(() => profile.value?.photo_urls_signed?.length ? profile.value.photo_urls_signed : ['/kinky-logo.png']);

onMounted(async () => {
  const data = await api<{ party: any; profile: any; liked: boolean; matched: boolean }>(`get-profile?slug=${encodeURIComponent(slug)}&profileId=${profileId}`);
  party.value = data.party;
  profile.value = data.profile;
  liked.value = data.liked;
  match.value = data.matched;
  applyTheme(data.party.theme || {});
});

async function like() {
  error.value = '';
  loadingLike.value = true;
  try {
    const data = await post<{ matched: boolean; telegram_username?: string | null }>('like-profile', { partyId: party.value.id, toProfileId: profileId });
    liked.value = true;
    match.value = data.matched;
    if (data.telegram_username) profile.value.telegram_username = data.telegram_username;
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loadingLike.value = false;
  }
}

async function report() {
  const details = prompt(t('reportPrompt'));
  if (!details) return;
  await post('report-profile', { partyId: party.value.id, reportedProfileId: profileId, reason: 'user_report', details });
  alert(t('reportSent'));
}
</script>
