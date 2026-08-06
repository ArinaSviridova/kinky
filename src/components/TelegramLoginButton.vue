<template>
  <div class="telegram-wrap">
    <button type="button" class="telegram-styled-button" @click="showWidget = true">
      {{ t('loginTelegram') }}
    </button>
    <div v-show="showWidget" class="telegram-widget-panel">
      <div id="telegram-login"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import { t } from '@/lib/i18n';

const emit = defineEmits<{ success: [] }>();
const showWidget = ref(false);
let script: HTMLScriptElement | null = null;

async function mountWidget() {
  await nextTick();
  const host = document.getElementById('telegram-login');
  if (!host || script) return;

  script = document.createElement('script');
  script.src = 'https://telegram.org/js/telegram-widget.js?22';
  script.async = true;
  script.setAttribute('data-telegram-login', import.meta.env.VITE_TELEGRAM_BOT_USERNAME);
  script.setAttribute('data-size', 'large');
  script.setAttribute('data-userpic', 'false');
  script.setAttribute('data-request-access', 'write');
  script.setAttribute('data-onauth', 'onTelegramAuth(user)');
  host.appendChild(script);
}

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

  mountWidget();
});

onUnmounted(() => {
  delete window.onTelegramAuth;
  document.getElementById('telegram-login')?.replaceChildren();
  script = null;
});
</script>
