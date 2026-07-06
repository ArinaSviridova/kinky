<template>
  <div class="language-switch" aria-label="Language switcher">
    <button type="button" class="small" :class="{ active: locale === 'ru' }" @click="setLocale('ru')">RU</button>
    <button type="button" class="small" :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button>
  </div>
</template>

<script setup lang="ts">
import { locale, setLocale } from '@/lib/i18n';
</script>
