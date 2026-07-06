<template>
  <section class="auth-page">
    <div class="auth-card privacy-content">
      <div class="auth-topline"><LanguageSwitch /></div>
      <img class="auth-logo" src="/kinky-logo.png" alt="Kinky Party" />
      <h1>{{ t('appTitle') }}</h1>
      <p>{{ t('loginIntro') }}</p>

      <div class="auth-actions">
        <TelegramLoginButton @success="goNext" />
        <button class="secondary" @click="signInGoogle">{{ t('loginGoogle') }}</button>
      </div>
      <p class="privacy-note">{{ t('screenshotNoticeText') }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import TelegramLoginButton from '@/components/TelegramLoginButton.vue';
import LanguageSwitch from '@/components/LanguageSwitch.vue';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';

const router = useRouter();

function goNext() {
  router.push('/enter-key');
}

async function signInGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}
</script>
