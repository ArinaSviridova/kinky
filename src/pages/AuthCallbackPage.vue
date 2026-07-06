<template>
  <section class="center-page privacy-content">
    <div class="card narrow">
      <h1>{{ t('authFinishing') }}</h1>
      <p>{{ message }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';

const router = useRouter();
const message = ref(t('authChecking'));

onMounted(async () => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    message.value = t('authNoSession');
    return;
  }

  const res = await fetch('/api/auth-google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ access_token: token }),
  });

  if (!res.ok) {
    message.value = t('authGoogleFailed');
    return;
  }

  router.push('/enter-key');
});
</script>
