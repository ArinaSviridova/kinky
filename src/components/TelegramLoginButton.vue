<template>
  <div class="telegram-wrap">
    <div id="telegram-login"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { t } from '@/lib/i18n';

const emit = defineEmits<{ success: [] }>();

onMounted(() => {
  window.onTelegramAuth = async (user: Record<string, unknown>) => {
    const res = await fetch('/api/auth-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(user),
    });

    if (!res.ok) {
      alert(t('telegramLoginFailed'));
      return;
    }

    emit('success');
  };

  const script = document.createElement('script');
  script.src = 'https://telegram.org/js/telegram-widget.js?22';
  script.async = true;
  script.setAttribute('data-telegram-login', import.meta.env.VITE_TELEGRAM_BOT_USERNAME);
  script.setAttribute('data-size', 'large');
  script.setAttribute('data-userpic', 'false');
  script.setAttribute('data-request-access', 'write');
  script.setAttribute('data-onauth', 'onTelegramAuth(user)');

  document.getElementById('telegram-login')?.appendChild(script);
});

onUnmounted(() => {
  delete window.onTelegramAuth;
  document.getElementById('telegram-login')?.replaceChildren();
});
</script>
