<template>
  <article class="profile-card">
    <img class="profile-photo protected-media" :src="photo" :alt="profile.nickname" />
    <div class="profile-card-body">
      <h3>{{ profile.nickname }}</h3>
      <p v-if="profile.bio">{{ profile.bio }}</p>
      <div class="tag-row">
        <span v-for="item in previewTags" :key="item" class="tag">{{ item }}</span>
      </div>
      <slot />
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { labelsForValues } from '@/lib/options';

const props = defineProps<{ profile: any }>();

const photo = computed(() => props.profile.photo_urls_signed?.[0] || '/kinky-logo.png');
const previewTags = computed(() => [
  ...labelsForValues((props.profile.looking_for || []).slice(0, 2)),
  ...labelsForValues((props.profile.interested_in || []).slice(0, 2)),
]);
</script>
