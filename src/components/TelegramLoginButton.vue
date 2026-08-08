<template>
  <div class="telegram-wrap">
    <button type="button" class="telegram-styled-button" :disabled="loading" @click="openTelegramLogin">
      {{ loading ? t('telegramLoginLoading') : t('loginTelegram') }}
    </button>

    <div v-if="showWidget" class="telegram-widget-panel">
      <div id="telegram-login"></div>
      <p class="telegram-widget-help">{{ t('telegramLoginHelp') }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, ref } from 'vue';
import { t } from '@/lib/i18n';
import { resetSession } from '@/lib/session';

const emit = defineEmits<{ success: [] }>();
const showWidget = ref(false);
const loading = ref(false);
const error = ref('');
let script: HTMLScriptElement | null = null;

async function mountWidget() {
  await nextTick();
  const host = document.getElementById('telegram-login');
  if (!host || script) return;

  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
  if (!botUsername) {
    error.value = t('telegramBotUsernameMissing');
    return;
  }

  script = document.createElement('script');
  script.src = 'https://telegram.org/js/telegram-widget.js?22';
  script.async = true;
  script.setAttribute('data-telegram-login', String(botUsername).replace(/^@/, ''));
  script.setAttribute('data-size', 'large');
  script.setAttribute('data-userpic', 'false');
  script.setAttribute('data-radius', '16');
  script.setAttribute('data-onauth', 'onTelegramAuth(user)');
  host.appendChild(script);
}

async function openTelegramLogin() {
  error.value = '';
  showWidget.value = true;
  await mountWidget();
}

window.onTelegramAuth = async (user: Record<string, unknown>) => {
  loading.value = true;
  error.value = '';

  try {
    const res = await fetch('/api/auth-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(user),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      throw new Error(payload?.error || t('telegramLoginFailed'));
    }

    resetSession();
    emit('success');
  } catch (e: any) {
    error.value = e.message || t('telegramLoginFailed');
  } finally {
    loading.value = false;
  }
};

onUnmounted(() => {
  delete window.onTelegramAuth;
  document.getElementById('telegram-login')?.replaceChildren();
  script = null;
});
</script>
