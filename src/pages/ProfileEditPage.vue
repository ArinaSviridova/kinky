<template>
  <AppShell :party-slug="slug">
    <section class="content">
      <div class="card wide">
        <h1>{{ t('myProfile') }}</h1>
        <p>{{ t('profileOnlyForParty') }}</p>
        <p class="muted">{{ t('previewAfterSave') }}</p>

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
            {{ t('aboutMeRu') }}
            <textarea v-model="form.bio_ru" required rows="5" :placeholder="t('aboutMePlaceholder')" />
          </label>

          <label class="full">
            {{ t('aboutMeEn') }}
            <textarea v-model="form.bio_en" rows="5" :placeholder="t('aboutMePlaceholder')" />
          </label>

          <label>
            {{ t('goingAs') }}
            <select v-model="form.going_as">
              <option value="">{{ t('dontSpecify') }}</option>
              <option v-for="item in goingAsOptions" :key="item.value" :value="item.value">{{ t(item.labelKey) }}</option>
            </select>
          </label>

          <label class="full">
            {{ t('photos') }}
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple @change="onFiles" />
            <small>{{ t('photoHelp') }}</small>
          </label>

          <div v-if="photoPreviews.length" class="full photo-preview-grid">
            <figure v-for="(photo, index) in photoPreviews" :key="photo.path || photo.url" class="photo-preview-card">
              <img :src="photo.url" class="protected-media" :alt="`${t('photo')} ${index + 1}`" />
              <button type="button" class="danger small" @click="removePhoto(index)">{{ t('removePhoto') }}</button>
            </figure>
          </div>

          <div class="full fieldset">
            <h2>{{ t('interestedIn') }}</h2>
            <MultiCheckbox v-model="form.interested_in" :options="interestedInOptions" />
          </div>

          <div class="full fieldset">
            <h2>{{ t('lookingFor') }}</h2>
            <MultiCheckbox v-model="form.looking_for" :options="lookingForOptions" />
          </div>

          <label class="full">
            {{ t('lookingForRu') }}
            <textarea v-model="form.looking_for_text_ru" rows="3" />
          </label>
          <label class="full">
            {{ t('lookingForEn') }}
            <textarea v-model="form.looking_for_text_en" rows="3" />
          </label>

          <div class="full fieldset">
            <h2>{{ t('approachPreferences') }}</h2>
            <MultiCheckbox v-model="form.approach_preferences" :options="approachOptions" />
          </div>

          <label class="full">
            {{ t('approachRu') }}
            <textarea v-model="form.approach_text_ru" rows="3" />
          </label>
          <label class="full">
            {{ t('approachEn') }}
            <textarea v-model="form.approach_text_en" rows="3" />
          </label>

          <div class="full fieldset">
            <h2>{{ t('boundaries') }}</h2>
            <MultiCheckbox v-model="form.boundaries" :options="boundaryOptions" />
          </div>

          <label class="full">
            {{ t('boundariesRu') }}
            <textarea v-model="form.boundaries_text_ru" rows="3" />
          </label>
          <label class="full">
            {{ t('boundariesEn') }}
            <textarea v-model="form.boundaries_text_en" rows="3" />
          </label>

          <label class="full">
            {{ t('icebreakerRu') }}
            <input v-model="form.icebreaker_ru" :placeholder="t('icebreakerPlaceholder')" />
          </label>
          <label class="full">
            {{ t('icebreakerEn') }}
            <input v-model="form.icebreaker_en" :placeholder="t('icebreakerPlaceholder')" />
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
import { useRoute, useRouter } from 'vue-router';
import AppShell from '@/components/AppShell.vue';
import MultiCheckbox from '@/components/MultiCheckbox.vue';
import { api, post } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { interestedInOptions, lookingForOptions, approachOptions, boundaryOptions, goingAsOptions } from '@/lib/options';
import { applyTheme } from '@/lib/theme';
import { t } from '@/lib/i18n';

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 500 * 1024;

const route = useRoute();
const router = useRouter();
const slug = String(route.params.slug);
const party = ref<any>(null);
const files = ref<File[]>([]);
const loading = ref(false);
const error = ref('');
const success = ref(false);
const photoPreviews = ref<Array<{ path: string; url: string }>>([]);

const form = reactive<any>({
  nickname: '',
  telegram_username: '',
  bio: '',
  bio_ru: '',
  bio_en: '',
  photo_urls: [],
  going_as: '',
  interested_in: [],
  looking_for: [],
  looking_for_text_ru: '',
  looking_for_text_en: '',
  approach_preferences: [],
  approach_text_ru: '',
  approach_text_en: '',
  boundaries: [],
  boundaries_text_ru: '',
  boundaries_text_en: '',
  languages: [],
  icebreaker: '',
  icebreaker_ru: '',
  icebreaker_en: '',
  confirmed_18_plus: false,
  accepted_rules: false,
  accepted_privacy: false,
});

onMounted(async () => {
  const data = await api<{ party: any; profile: any | null }>(`my-profile?slug=${encodeURIComponent(slug)}`);
  party.value = data.party;
  applyTheme(data.party.theme || {});

  if (data.profile) {
    Object.assign(form, data.profile);
    form.bio_ru = data.profile.bio_ru || data.profile.bio || '';
    form.bio_en = data.profile.bio_en || '';
    form.icebreaker_ru = data.profile.icebreaker_ru || data.profile.icebreaker || '';
    form.icebreaker_en = data.profile.icebreaker_en || '';
    form.photo_urls = data.profile.photo_urls || [];
    photoPreviews.value = (data.profile.photo_urls || []).map((path: string, index: number) => ({
      path,
      url: data.profile.photo_urls_signed?.[index] || '/kinky-logo.png',
    }));
  }
});

function onFiles(e: Event) {
  const target = e.target as HTMLInputElement;
  const selected = Array.from(target.files || []);
  if (selected.length + form.photo_urls.length > MAX_PHOTOS) {
    error.value = t('photoLimitError');
    target.value = '';
    return;
  }
  files.value = selected;
}

function removePhoto(index: number) {
  form.photo_urls.splice(index, 1);
  photoPreviews.value.splice(index, 1);
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Image compression failed')), type, quality);
  });
}

async function compressImage(file: File) {
  if (!file.type.startsWith('image/')) throw new Error('Unsupported file type');

  const image = new Image();
  const objectUrl = URL.createObjectURL(file);
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = objectUrl;
  });

  URL.revokeObjectURL(objectUrl);

  const type = 'image/webp';
  const maxWidths = [1200, 1000, 800, 640];
  const qualities = [0.82, 0.74, 0.66, 0.58, 0.5];

  for (const maxWidth of maxWidths) {
    const scale = Math.min(1, maxWidth / image.width);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available');
    ctx.drawImage(image, 0, 0, width, height);

    for (const quality of qualities) {
      const blob = await canvasToBlob(canvas, type, quality);
      if (blob.size <= MAX_FILE_SIZE) {
        const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
        return new File([blob], name, { type });
      }
    }
  }

  throw new Error(t('photoSizeError'));
}

async function uploadNewPhotos() {
  if (!files.value.length || !party.value) return form.photo_urls || [];

  const uploaded: string[] = [];
  for (const rawFile of files.value) {
    const file = await compressImage(rawFile);
    const upload = await post<{ path: string; token: string }>('create-photo-upload-url', {
      partyId: party.value.id,
      fileName: file.name,
      fileSize: file.size,
    });

    const { error: uploadError } = await supabase.storage
      .from('party-photos')
      .uploadToSignedUrl(upload.path, upload.token, file);

    if (uploadError) throw uploadError;
    uploaded.push(upload.path);
  }

  return [...(form.photo_urls || []), ...uploaded].slice(0, MAX_PHOTOS);
}

async function save() {
  loading.value = true;
  error.value = '';
  success.value = false;

  try {
    const photo_urls = await uploadNewPhotos();
    if (!photo_urls.length) throw new Error(t('photoRequiredError'));
    if (photo_urls.length > MAX_PHOTOS) throw new Error(t('photoLimitError'));

    const payload = {
      ...form,
      bio: form.bio_ru || form.bio_en,
      icebreaker: form.icebreaker_ru || form.icebreaker_en,
      photo_urls,
    };

    const data = await post<{ profile: any }>('profile-save', { partyId: party.value.id, profile: payload });
    success.value = true;
    router.push(`/party/${slug}/profiles/${data.profile.id}`);
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>
