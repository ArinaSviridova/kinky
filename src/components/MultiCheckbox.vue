<template>
  <div class="check-grid">
    <label v-for="option in options" :key="option.value" class="check-pill">
      <input v-model="model" type="checkbox" :value="option.value" />
      <span>{{ t(option.labelKey) }}</span>
    </label>
  </div>
</template>

<script setup lang="ts">
import type { SelectOption } from '@/lib/options';
import { t } from '@/lib/i18n';

const model = defineModel<string[]>({ required: true });
defineProps<{ options: SelectOption[] }>();
</script>
