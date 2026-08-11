<template>
  <div class="card pwa-guide-card">
    <div>
      <p class="eyebrow">PWA</p>
      <h2>{{ t('pwaInstallTitle') }}</h2>
      <p>{{ t('pwaInstallText') }}</p>
    </div>
    <div class="pwa-guide-grid">
      <div>
        <h3>{{ t('pwaInstallIosTitle') }}</h3>
        <ol>
          <li>{{ t('pwaInstallIosStep1') }}</li>
          <li>{{ t('pwaInstallIosStep2') }}</li>
          <li>{{ t('pwaInstallIosStep3') }}</li>
        </ol>
      </div>
      <div>
        <h3>{{ t('pwaInstallAndroidTitle') }}</h3>
        <ol>
          <li>{{ t('pwaInstallAndroidStep1') }}</li>
          <li>{{ t('pwaInstallAndroidStep2') }}</li>
          <li>{{ t('pwaInstallAndroidStep3') }}</li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { t } from '@/lib/i18n';
</script>
