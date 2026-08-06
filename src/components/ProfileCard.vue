<template>
  <article class="profile-card" :class="{ mine: profile.isMine }">
    <div class="profile-photo-wrap">
      <img class="profile-photo protected-media" loading="lazy" :src="photo" :alt="profile.nickname" />
      <span v-if="profile.isMine" class="badge">{{ t('myProfileBadge') }}</span>
      <span v-else-if="profile.isMatched" class="badge success-badge">{{ t('matched') }}</span>
    </div>
    <div class="profile-card-body">
      <h3>{{ profile.nickname }}</h3>
      <p v-if="bio">{{ bio }}</p>
      <div class="tag-row">
        <span v-for="item in previewTags" :key="item" class="tag">{{ item }}</span>
      </div>
      <div class="card-actions">
        <slot />
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { labelsForValues } from '@/lib/options';
import { localized } from '@/lib/localized';
import { t } from '@/lib/i18n';

const props = defineProps<{ profile: any }>();

const photo = computed(() => props.profile.photo_urls_signed?.[0] || '/kinky-logo.png');
const bio = computed(() => localized(props.profile, 'bio'));
const previewTags = computed(() => [
  ...labelsForValues((props.profile.looking_for || []).slice(0, 2)),
  ...labelsForValues((props.profile.interested_in || []).slice(0, 2)),
]);
</script>
