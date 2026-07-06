<template>
  <div class="page-shell">
    <header class="topbar">
      <RouterLink class="brand" :to="homeTo">
        <img src="/kinky-logo.png" alt="Kinky Party" />
        <span>{{ t('appTitle') }}</span>
      </RouterLink>
      <nav class="topnav">
        <RouterLink v-if="partySlug" :to="`/party/${partySlug}`">{{ t('navHome') }}</RouterLink>
        <RouterLink v-if="partySlug" :to="`/party/${partySlug}/profiles`">{{ t('navProfiles') }}</RouterLink>
        <RouterLink v-if="partySlug" :to="`/party/${partySlug}/matches`">{{ t('navMatches') }}</RouterLink>
        <RouterLink v-if="partySlug" :to="`/party/${partySlug}/rules`">{{ t('navRules') }}</RouterLink>
        <RouterLink to="/admin">{{ t('navAdmin') }}</RouterLink>
        <LanguageSwitch />
      </nav>
    </header>
    <main class="privacy-content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import LanguageSwitch from '@/components/LanguageSwitch.vue';
import { t } from '@/lib/i18n';

const props = defineProps<{ partySlug?: string }>();
const homeTo = props.partySlug ? `/party/${props.partySlug}` : '/enter-key';
</script>
