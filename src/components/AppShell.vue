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
        <RouterLink to="/enter-key">{{ t('navApp') }}</RouterLink>
        <RouterLink v-if="isAdmin" to="/admin">{{ t('navAdmin') }}</RouterLink>
        <button class="link-button" type="button" @click="logout">{{ t('logout') }}</button>
        <LanguageSwitch />
      </nav>
    </header>
    <main class="privacy-content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import LanguageSwitch from '@/components/LanguageSwitch.vue';
import { t } from '@/lib/i18n';
import { post } from '@/lib/api';
import { loadSession, resetSession } from '@/lib/session';

const props = defineProps<{ partySlug?: string }>();
const router = useRouter();
const homeTo = '/enter-key';
const isAdmin = ref(false);

onMounted(async () => {
  const session = await loadSession();
  isAdmin.value = session.isAdmin;
});

async function logout() {
  await post('logout', {});
  resetSession();
  router.push('/login');
}
</script>
