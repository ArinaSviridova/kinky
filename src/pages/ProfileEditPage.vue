<template>
  <AppShell :party-slug="slug">
    <section class="content">
      <div class="card wide">
        <h1>{{ t('myProfile') }}</h1>
        <p>{{ t('profileOnlyForParty') }}</p>

        <form class="form-grid" @submit.prevent="save">
          <label>
            {{ t('displayName') }}
            <input v-model="form.nickname" required />
          </label>

          <label>
            {{ t('telegramUsername') }}
            <input v-model="form.telegram_username" required :placeholder="t('telegramPlaceholder')" />
          </label>

          <label class="full">
            {{ t('aboutMe') }}
            <textarea v-model="form.bio" required rows="5" :placeholder="t('aboutMePlaceholder')" />
          </label>

          <label>
            {{ t('goingAs') }}
            <select v-model="form.going_as">
              <option value="">{{ t('dontSpecify') }}</option>
              <option v-for="item in goingAsOptions" :key="item.value" :value="item.value">{{ t(item.labelKey) }}</option>
            </select>
          </label>

          <label class="full">
            {{ t('photo') }}
            <input type="file" accept="image/*" @change="onFile" />
            <small>{{ t('photoHelp') }}</small>
          </label>

          <div class="full fieldset">
            <h2>{{ t('interestedIn') }}</h2>
            <MultiCheckbox v-model="form.interested_in" :options="interestedInOptions" />
          </div>

          <div class="full fieldset">
            <h2>{{ t('lookingFor') }}</h2>
            <MultiCheckbox v-model="form.looking_for" :options="lookingForOptions" />
          </div>

          <div class="full fieldset">
            <h2>{{ t('approachPreferences') }}</h2>
            <MultiCheckbox v-model="form.approach_preferences" :options="approachOptions" />
          </div>

          <div class="full fieldset">
            <h2>{{ t('boundaries') }}</h2>
            <MultiCheckbox v-model="form.boundaries" :options="boundaryOptions" />
          </div>

          <label class="full">
            {{ t('icebreaker') }}
            <input v-model="form.icebreaker" :placeholder="t('icebreakerPlaceholder')" />
          </label>

          <div class="full consent-box">
            <label><input v-model="form.confirmed_18_plus" type="checkbox" /> {{ t('confirm18') }}</label>
            <label><input v-model="form.accepted_rules" type="checkbox" /> {{ t('acceptRules') }}</label>
            <label><input v-model="form.accepted_privacy" type="checkbox" /> {{ t('acceptPrivacy') }}</label>
          </div>

          <button :disabled="loading">{{ t('saveProfile') }}</button>
        </form>
        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="success" class="success">{{ t('profileSaved') }}</p>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppShell from '@/components/AppShell.vue';
import MultiCheckbox from '@/components/MultiCheckbox.vue';
import { api, post } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { interestedInOptions, lookingForOptions, approachOptions, boundaryOptions, goingAsOptions } from '@/lib/options';
import { applyTheme } from '@/lib/theme';
import { t } from '@/lib/i18n';

const route = useRoute();
const slug = String(route.params.slug);
const party = ref<any>(null);
const file = ref<File | null>(null);
const loading = ref(false);
const error = ref('');
const success = ref(false);

const form = reactive<any>({
  nickname: '',
  telegram_username: '',
  bio: '',
  photo_urls: [],
  going_as: '',
  interested_in: [],
  looking_for: [],
  approach_preferences: [],
  boundaries: [],
  languages: [],
  icebreaker: '',
  confirmed_18_plus: false,
  accepted_rules: false,
  accepted_privacy: false,
});

onMounted(async () => {
  const data = await api<{ party: any }>(`get-party?slug=${encodeURIComponent(slug)}`);
  party.value = data.party;
  applyTheme(data.party.theme || {});

  const profile = await api<{ profile: any | null }>(`my-profile?partyId=${data.party.id}`);
  if (profile.profile) Object.assign(form, profile.profile);
});

function onFile(e: Event) {
  const target = e.target as HTMLInputElement;
  file.value = target.files?.[0] || null;
}

async function uploadPhotoIfNeeded() {
  if (!file.value || !party.value) return form.photo_urls || [];

  const upload = await post<{ path: string; token: string }>('create-photo-upload-url', {
    partyId: party.value.id,
    fileName: file.value.name,
  });

  const { error: uploadError } = await supabase.storage
    .from('party-photos')
    .uploadToSignedUrl(upload.path, upload.token, file.value);

  if (uploadError) throw uploadError;

  return [upload.path];
}

async function save() {
  loading.value = true;
  error.value = '';
  success.value = false;

  try {
    const photo_urls = await uploadPhotoIfNeeded();
    if (!photo_urls.length) throw new Error(t('photoRequiredError'));

    await post('profile-save', { partyId: party.value.id, profile: { ...form, photo_urls } });
    success.value = true;
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>
